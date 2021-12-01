import { FC, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  InputAdornment,
  LinearProgress,
  TextField,
} from '@material-ui/core';

import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import Screen from '../../components/layout/Screen';
import { customProviderFactory, txHandler } from '../../lib/anchorUtils';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { AnchorTypes } from '@saberhq/anchor-contrib';
import { BN } from '@project-serum/anchor';
import { CommunityStaking as CommunityStakingIdl } from '../../lib/idl/community_staking';
import CommunityStakingJson from '../../lib/idl/community_staking.json';
import { TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { Program, utils } from '@project-serum/anchor';
import {
  createOwnAssociatedTokenAccountInstruction,
  findAssociatedTokenAccountAddressSync,
  getBuyerATABalance,
  getDisplayAmount,
} from '../../lib/accounts';
import { toHHMMSS } from '../../lib/utils';
import * as mathjs from 'mathjs';
import { tokenInfoMap } from '../../config/tokenRegistry';
import { useStyles } from './styles';

const COMMUNITY_STAKING_PROGRAM_ID = new PublicKey(
  process.env.REACT_APP_COMMUNITY_STAKING_PROGRAM_ID as string
);
const REGISTRY_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.REACT_APP_REGISTRY_KEYPAIR as string))
);
const REGISTRY_ADDRESS = REGISTRY_KEYPAIR.publicKey;
const REWARD_RATE_NUMERATOR = Number(
  process.env.REACT_APP_REWARD_RATE_NUMERATOR
);
const REWARD_PERIOD = Number(process.env.REACT_APP_REWARD_PERIOD);
const [VAULT] = utils.publicKey.findProgramAddressSync(
  [Buffer.from('vault'), REGISTRY_ADDRESS.toBytes()],
  COMMUNITY_STAKING_PROGRAM_ID
);
console.log(`vault address: ${VAULT.toBase58()}`);

const STAKING_TOKEN_INFO = [...tokenInfoMap.values()].find((info) => {
  return info.symbol === (process.env.REACT_APP_STAKING_TOKEN_SYMBOL as string);
});
if (!STAKING_TOKEN_INFO) {
  throw new Error('Staking token not found');
}
const STAKING_TOKEN_MINT = new PublicKey(STAKING_TOKEN_INFO.address);

export type CommunityStakingTypes = AnchorTypes<
  CommunityStakingIdl,
  {
    registry: RegistryType;
    stakeAccount: StakeAccountType;
  }
>;

type Accounts = CommunityStakingTypes['Accounts'];
export type RegistryType = Accounts['registry'];
export type StakeAccountType = Accounts['stakeAccount'];
export type CommunityStakingProgram = CommunityStakingTypes['Program'];

const StakeScreen: FC = () => {
  const classes = useStyles();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [stakeAccount, setStakeAccount] = useState<StakeAccountType>();
  const [latestBlockTimestamp, setLastestBlockTimestamp] = useState<
    number | null
  >();
  const [amount, setAmount] = useState<string>('');
  const [buyerATABalance, setBuyerATABalance] = useState<u64>();

  const stakingClient = useMemo(() => {
    // @ts-ignore
    const stakingClient = new Program(
      CommunityStakingJson as CommunityStakingIdl,
      COMMUNITY_STAKING_PROGRAM_ID,
      customProviderFactory(connection, anchorWallet)
    ) as CommunityStakingProgram;
    return stakingClient;
  }, [connection, anchorWallet]);

  const stakeAccountAddress = useMemo(() => {
    if (!stakingClient.provider.wallet.publicKey) return;

    const [address] = utils.publicKey.findProgramAddressSync(
      [
        Buffer.from('stake'),
        REGISTRY_ADDRESS.toBytes(),
        stakingClient.provider.wallet.publicKey.toBytes(),
      ],
      COMMUNITY_STAKING_PROGRAM_ID
    );
    return address;
  }, [stakingClient.provider.wallet.publicKey]);

  const stakerATAAddress = useMemo(() => {
    if (!stakingClient.provider.wallet.publicKey) return;

    const [address] = findAssociatedTokenAccountAddressSync(
      stakingClient.provider.wallet.publicKey,
      STAKING_TOKEN_MINT
    );
    return address;
  }, [stakingClient.provider.wallet.publicKey]);

  useEffect(() => {
    async function update() {
      if (!stakeAccountAddress) return;

      try {
        const newStakeAccount = await stakingClient.account.stakeAccount.fetch(
          stakeAccountAddress
        );
        setStakeAccount(newStakeAccount);
        console.log(newStakeAccount);
      } catch {
        setStakeAccount(undefined);
      }
    }
    if (!stakingClient.provider.wallet.publicKey) {
      setStakeAccount(undefined);
      return;
    }

    update();
    const intervalId = setInterval(update, 10_000);
    return () => clearInterval(intervalId);
  }, [stakingClient, stakeAccountAddress]);

  useEffect(() => {
    async function update() {
      const slot = await connection.getSlot();
      setLastestBlockTimestamp(await connection.getBlockTime(slot));
    }
    update();
    const intervalId = setInterval(update, 10_000);
    return () => clearInterval(intervalId);
  }, [connection]);

  useEffect(() => {
    if (!stakingClient.provider.wallet.publicKey) {
      setBuyerATABalance(undefined);
      return;
    }
    async function updateBuyerATABalance() {
      setBuyerATABalance(
        await getBuyerATABalance(stakingClient.provider, STAKING_TOKEN_MINT)
      );
    }
    const timerId = setInterval(() => {
      updateBuyerATABalance();
    }, 5000);
    updateBuyerATABalance();
    return () => clearInterval(timerId);
  }, [stakingClient.provider]);

  const rewardsMeta = useMemo(() => {
    if (!stakeAccount || !latestBlockTimestamp) return;

    const remainingTime = stakeAccount.rewardsEndTimestamp.gte(
      new BN(latestBlockTimestamp)
    )
      ? stakeAccount.rewardsEndTimestamp.sub(new BN(latestBlockTimestamp))
      : new BN(0);

    const effectiveElapsedTime = BN.min(
      stakeAccount.rewardsEndTimestamp,
      new BN(latestBlockTimestamp)
    ).sub(stakeAccount.rewardsStartTimestamp);

    const pendingRewards = effectiveElapsedTime
      .mul(stakeAccount.amount)
      .mul(stakeAccount.multiplier)
      .mul(new BN(REWARD_RATE_NUMERATOR))
      .div(new BN(100_000_000));

    const period = stakeAccount.rewardsEndTimestamp.sub(
      stakeAccount.rewardsStartTimestamp
    );

    // From 0 to 100
    const progress = period.isZero()
      ? 0
      : effectiveElapsedTime.muln(100).div(period).toNumber();

    return {
      remainingTime,
      pendingRewards,
      progress,
    };
  }, [stakeAccount, latestBlockTimestamp]);

  return (
    <Screen>
      <Card title="Stake">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
        >
          <CardMedia
            component="img"
            src="/dRaffle-logo.png"
            className={classes.media}
          />
        </Box>
        {stakingClient.provider.wallet?.publicKey ? (
          <>
            <CardContent>
              {stakeAccount ? (
                <div>
                  You have{' '}
                  {getDisplayAmount(stakeAccount.amount, STAKING_TOKEN_INFO)}{' '}
                  {STAKING_TOKEN_INFO.symbol} staked, rewards are 15% of the
                  staked amount per day
                  <br />
                  Pending rewards{' '}
                  {rewardsMeta
                    ? getDisplayAmount(
                        rewardsMeta.pendingRewards,
                        STAKING_TOKEN_INFO
                      )
                    : 'N/A'}{' '}
                  {STAKING_TOKEN_INFO.symbol}
                  <br />
                  Rewards end in{' '}
                  {rewardsMeta
                    ? toHHMMSS(rewardsMeta.remainingTime.toNumber())
                    : 'N/A'}
                  <br />
                  Until{' '}
                  {stakeAccount.rewardsEndTimestamp.isZero()
                    ? 'N/A'
                    : new Date(
                        stakeAccount.rewardsEndTimestamp.muln(1000).toNumber()
                      ).toISOString()}
                  <br />
                  <br />
                  <LinearProgress
                    variant="determinate"
                    value={rewardsMeta?.progress || 0}
                    style={{ height: '20px' }}
                  />
                  <br />
                  You have{' '}
                  {buyerATABalance
                    ? getDisplayAmount(buyerATABalance, STAKING_TOKEN_INFO)
                    : '0'}{' '}
                  {STAKING_TOKEN_INFO.symbol}
                </div>
              ) : (
                'No stake account'
              )}
            </CardContent>
            <CardActions>
              {stakeAccount ? (
                <>
                  <TextField
                    type="number"
                    value={amount}
                    onChange={({ target }) => {
                      setAmount(target.value);
                    }}
                    placeholder="0"
                    // error={error !== null}
                    // helperText={error}
                    InputProps={{
                      endAdornment: (
                        <>
                          <InputAdornment position="end">
                            <Button
                              disabled={!buyerATABalance}
                              onClick={() => {
                                if (!buyerATABalance) return;
                                setAmount(
                                  getDisplayAmount(
                                    buyerATABalance,
                                    STAKING_TOKEN_INFO
                                  )
                                );
                              }}
                            >
                              MAX
                            </Button>
                          </InputAdornment>
                          <InputAdornment position="end">
                            {STAKING_TOKEN_INFO.symbol}
                          </InputAdornment>
                        </>
                      ),
                      inputProps: {
                        step: 0.1,
                      },
                    }}
                  />
                  <Button
                    onClick={async () => {
                      if (!stakeAccountAddress || !stakerATAAddress) return;
                      const rawAmount = amount
                        ? new BN(
                            mathjs
                              .bignumber(amount)
                              .mul(
                                mathjs
                                  .bignumber(10)
                                  .pow(STAKING_TOKEN_INFO.decimals)
                              )
                              .toString()
                          )
                        : new BN(0);
                      await txHandler(
                        () =>
                          stakingClient.rpc.stake(rawAmount, {
                            accounts: {
                              registry: REGISTRY_ADDRESS,
                              vault: VAULT,
                              staker: stakingClient.provider.wallet.publicKey,
                              stakerTokenAccount: stakerATAAddress,
                              stakeAccount: stakeAccountAddress,
                              tokenProgram: TOKEN_PROGRAM_ID,
                            },
                          }),
                        'Staked!'
                      );
                      setAmount('');
                    }}
                  >
                    Stake
                  </Button>

                  <Button
                    disabled={!stakeAccount || stakeAccount.amount.isZero()}
                    onClick={async () => {
                      if (!stakeAccountAddress || !stakerATAAddress) return;
                      await txHandler(
                        async () =>
                          stakingClient.rpc.unstake({
                            accounts: {
                              registry: REGISTRY_ADDRESS,
                              vault: VAULT,
                              staker: stakingClient.provider.wallet.publicKey,
                              stakerTokenAccount: stakerATAAddress,
                              stakeAccount: stakeAccountAddress,
                              tokenProgram: TOKEN_PROGRAM_ID,
                            },
                            instructions: buyerATABalance
                              ? undefined
                              : [
                                  createOwnAssociatedTokenAccountInstruction(
                                    STAKING_TOKEN_MINT,
                                    stakerATAAddress,
                                    stakingClient.provider.wallet.publicKey
                                  ),
                                ],
                          }),
                        'Unstaked!'
                      );
                    }}
                  >
                    Unstake
                  </Button>
                </>
              ) : (
                <Button
                  onClick={async () => {
                    if (!stakeAccountAddress) return;
                    await txHandler(
                      () =>
                        stakingClient.rpc.createStakeAccount({
                          accounts: {
                            registry: REGISTRY_ADDRESS,
                            staker: stakingClient.provider.wallet.publicKey,
                            stakeAccount: stakeAccountAddress,
                            systemProgram: SystemProgram.programId,
                          },
                        }),
                      'Stake account created'
                    );
                  }}
                >
                  Create stake account
                </Button>
              )}
            </CardActions>
          </>
        ) : (
          <CardContent>Connect wallet to start staking</CardContent>
        )}
      </Card>
      <br />
      {[
        '86f5xSDrue8Zz4QfuMErURN3o393L72zA1J2WRsYeTGB',
        '2zcTAzzHmvVPWjpFL5PnHhF6yutr5VXq61xueshhPwnU',
      ].includes(stakingClient.provider.wallet.publicKey?.toBase58()) && (
        <Card title="Admin">
          <CardActions>
            <Button
              onClick={async () => {
                const rewardPeriod = new BN(REWARD_PERIOD);
                const rewardRateNumerator = new BN(REWARD_RATE_NUMERATOR);

                const signature = await stakingClient.rpc.createRegistry(
                  rewardPeriod,
                  rewardRateNumerator,
                  {
                    accounts: {
                      registry: REGISTRY_ADDRESS,
                      vault: VAULT,
                      mint: STAKING_TOKEN_MINT,
                      admin: stakingClient.provider.wallet.publicKey,
                      tokenProgram: TOKEN_PROGRAM_ID,
                      systemProgram: SystemProgram.programId,
                      rent: SYSVAR_RENT_PUBKEY,
                    },
                    signers: [REGISTRY_KEYPAIR],
                  }
                );
                console.log(signature);
              }}
            >
              Create registry
            </Button>
          </CardActions>
        </Card>
      )}
    </Screen>
  );
};

export default StakeScreen;

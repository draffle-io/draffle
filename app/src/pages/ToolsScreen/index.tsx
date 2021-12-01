import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import { ExpandMore, Refresh } from '@material-ui/icons';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { WalletMultiButton } from '@solana/wallet-adapter-material-ui';

import Screen from '../../components/layout/Screen';
import { shortenPubkeyString, sleep } from '../../lib/utils';
import { txHandler } from '../../lib/anchorUtils';
import { useProgramApis } from '../../hooks/useProgramApis';
import { TESTING } from '../../config/misc';
import Spacer from '../../components/Spacer';
import useCommonStyles from '../../assets/styles';
import { useStyles } from './styles';

const TOKEN_ACCOUNT_RENT_EXEMPTION_THRESHOLD = 0.00203928;

const getEmptyTokenAccountAddresses = async (
  connection: Connection,
  ownerAddress: PublicKey
): Promise<string[]> => {
  const parsedTokenAccounts = (
    await connection.getParsedTokenAccountsByOwner(ownerAddress, {
      programId: TOKEN_PROGRAM_ID,
    })
  ).value;
  return parsedTokenAccounts
    .map(({ pubkey, account }) => {
      const info = account.data.parsed.info;
      return info.tokenAmount.uiAmount === 0 ? pubkey.toBase58() : undefined;
    })
    .filter(Boolean) as string[];
};

// No websocket sender with tx confirmation awaiting
// Borrowed from lib, can we factorize?
const sender = async (
  connection: Connection,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  tx: Transaction,
  signers: Array<Signer> = []
  //opts?: ConfirmOptions
): Promise<TransactionSignature> => {
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

  tx = await signTransaction(tx);
  if (signers.length > 0) {
    tx.partialSign(...signers);
  }

  const rawTx = tx.serialize();
  const signature = await connection.sendRawTransaction(rawTx);

  // Await for 30 seconds
  for (let i = 0; i < 30; i++) {
    const signatureStatus = (await connection.getSignatureStatus(signature))
      .value;
    if (signatureStatus?.confirmationStatus === 'confirmed') {
      return signature;
    }
    await sleep(1000);
  }
  throw new Error(`Tx ${signature} has not been confirmed within 30 seconds`);
};

const createCloseIx = (
  tokenAccountAddress: PublicKey,
  authority: PublicKey
) => {
  return Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    tokenAccountAddress,
    authority,
    authority,
    []
  );
};

const ToolsScreen: FC = () => {
  const classes = { ...useCommonStyles(), ...useStyles() };
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { draffleClient } = useProgramApis();
  const [emptyTokenAccountAddresses, setEmptyTokenAccountAddresses] = useState<
    string[]
  >([]);
  const [
    selectedEmptyTokenAccountAddress,
    setSelectedEmptyTokenAccountAddress,
  ] = useState<string>('');
  const [cleanupOneOngoing, setCleanupOneOngoing] = useState(false);
  const [cleanupAllOngoing, setCleanupAllOngoing] = useState(false);

  const updateEmptyTokenAccountAddresses = useCallback(() => {
    if (!publicKey) {
      setEmptyTokenAccountAddresses([]);
      return;
    }
    return getEmptyTokenAccountAddresses(connection, publicKey).then(
      setEmptyTokenAccountAddresses
    );
  }, [connection, publicKey, setEmptyTokenAccountAddresses]);

  useEffect(() => {
    updateEmptyTokenAccountAddresses();
  }, [updateEmptyTokenAccountAddresses]);

  const maxEmptyTokenAccountAddresses = useMemo(
    () => emptyTokenAccountAddresses.slice(0, 27),
    [emptyTokenAccountAddresses]
  );

  return (
    <Screen>
      <div className={classes.root}>
        <div className={classes.titleSection}>
          <Typography variant="h1">Wallet Cleanup Tool</Typography>
        </div>
        <div className={classes.mainSection}>
          <div className={classes.descriptionSection}>
            <HowTo />
          </div>
          <div className={classes.cleanupSection}>
            <div className={classes.actionSection}>
              {!publicKey ? (
                <>
                  <div className={classes.actionTagline}>
                    <Typography
                      variant="h3"
                      className={classes.highlightSecondary}
                    >
                      Connect your wallet to begin.
                    </Typography>
                  </div>
                  <WalletMultiButton
                    variant="outlined"
                    color="secondary"
                    className={`${classes.mainButton} ${classes.connectToBuyButton}`}
                  >
                    Connect
                  </WalletMultiButton>
                </>
              ) : (
                <div className={classes.actionSectionInner}>
                  {emptyTokenAccountAddresses.length === 0 ? (
                    <div className={classes.accountCount}>
                      <Typography component={'div'}>
                        You have
                        <span className={classes.highlightPrimary}> 0 </span>
                        empty token accounts!
                      </Typography>
                      <IconButton
                        size="small"
                        className={classes.refreshButtonContainer}
                        onClick={() => {
                          updateEmptyTokenAccountAddresses();
                        }}
                      >
                        <Refresh className={classes.refreshButton} />
                      </IconButton>
                    </div>
                  ) : (
                    <>
                      <div className={classes.accountCount}>
                        <Typography>
                          You have
                          <span className={classes.highlightPrimary}>
                            {' '}
                            {emptyTokenAccountAddresses.length}{' '}
                          </span>
                          empty token account(s)
                        </Typography>
                        <IconButton
                          size="small"
                          className={classes.refreshButtonContainer}
                          onClick={() => {
                            updateEmptyTokenAccountAddresses();
                          }}
                        >
                          <Refresh className={classes.refreshButton} />
                        </IconButton>
                      </div>
                      <Spacer height="30px" />
                      <div className={classes.accountSelection}>
                        <Select
                          label="Token account"
                          displayEmpty
                          value={selectedEmptyTokenAccountAddress}
                          onChange={(e) => {
                            setSelectedEmptyTokenAccountAddress(
                              e.target.value as string
                            );
                          }}
                          MenuProps={{
                            variant: 'menu',
                            getContentAnchorEl: null,
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select account to close
                          </MenuItem>
                          {emptyTokenAccountAddresses.map(
                            (emptyTokenAccountAddress) => {
                              return (
                                <MenuItem value={emptyTokenAccountAddress}>
                                  {shortenPubkeyString(
                                    new PublicKey(emptyTokenAccountAddress)
                                  )}
                                </MenuItem>
                              );
                            }
                          )}
                        </Select>
                      </div>
                      <Button
                        variant="contained"
                        className={`${classes.mainButton} ${classes.closeButton}`}
                        disabled={
                          !selectedEmptyTokenAccountAddress ||
                          cleanupOneOngoing ||
                          cleanupAllOngoing
                        }
                        onClick={async () => {
                          if (
                            !publicKey ||
                            emptyTokenAccountAddresses.length === 0 ||
                            !signTransaction
                          )
                            return;

                          setCleanupOneOngoing(true);
                          await txHandler(async () => {
                            const tx = new Transaction({
                              feePayer: publicKey,
                            });
                            tx.add(
                              createCloseIx(
                                new PublicKey(selectedEmptyTokenAccountAddress),
                                publicKey
                              )
                            );

                            return sender(connection, signTransaction, tx);
                          }, 'Token account closed!');
                          setSelectedEmptyTokenAccountAddress('');
                          await sleep(1000);
                          updateEmptyTokenAccountAddresses();
                          setCleanupOneOngoing(false);
                        }}
                      >
                        <div className={classes.purchaseButtonContent}>
                          {cleanupOneOngoing ? (
                            <>
                              <div
                                className={classes.purchaseButtonContentLeft}
                              >
                                <CircularProgress
                                  size={20}
                                  className={classes.purchaseSpinner}
                                />
                              </div>
                              <div
                                className={classes.purchaseButtonContentMiddle}
                              >
                                Processing...
                              </div>
                              <div
                                className={classes.purchaseButtonContentRight}
                              />
                            </>
                          ) : (
                            <>Close selected</>
                          )}
                        </div>
                      </Button>
                      <div className={classes.orDivider}>
                        <Typography>or</Typography>
                      </div>
                      <Button
                        variant="contained"
                        className={`${classes.mainButton} ${classes.closeButton}`}
                        disabled={
                          emptyTokenAccountAddresses.length === 0 ||
                          cleanupOneOngoing ||
                          cleanupAllOngoing
                        }
                        onClick={async () => {
                          if (!publicKey || !signTransaction) return;

                          setCleanupAllOngoing(true);
                          await txHandler(async () => {
                            const tx = new Transaction({
                              feePayer: publicKey,
                            });
                            for (const emptyTokenAccountAddress of maxEmptyTokenAccountAddresses) {
                              tx.add(
                                createCloseIx(
                                  new PublicKey(emptyTokenAccountAddress),
                                  publicKey
                                )
                              );
                            }
                            return sender(connection, signTransaction, tx);
                          }, 'Token accounts closed!');
                          setSelectedEmptyTokenAccountAddress('');
                          await sleep(1000);
                          updateEmptyTokenAccountAddresses();
                          setCleanupAllOngoing(false);
                        }}
                      >
                        <div className={classes.purchaseButtonContent}>
                          {cleanupAllOngoing ? (
                            <>
                              <div
                                className={classes.purchaseButtonContentLeft}
                              >
                                <CircularProgress
                                  size={20}
                                  className={classes.purchaseSpinner}
                                />
                              </div>
                              <div
                                className={classes.purchaseButtonContentMiddle}
                              >
                                Processing...
                              </div>
                              <div
                                className={classes.purchaseButtonContentRight}
                              />
                            </>
                          ) : (
                            <>
                              {(maxEmptyTokenAccountAddresses?.length ?? 0) < 27
                                ? `Close all in one click`
                                : `Close 27 accounts at once (max)`}
                            </>
                          )}
                        </div>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {TESTING && (
          <Button
            variant="contained"
            onClick={async () => {
              if (!publicKey || !signTransaction) return;
              [
                '7AF95zJCMQ1JNtkFJRuTiLhMc9xYeAyAHsBPgX8hXEmf',
                'JA2Ay71w8McVD6DMH93qGqvzxZGVGn9ZnTW6U1F8UuK8',
                'BzFPfRWV8fZcQkjTQDZDHwSL2hjWujo3L4NUWej7so4j',
                'FGDSKx4QAfMhzWrBkte4Y3aXdQBpjGudHW5cbyiaGyxm',
                'EExXV45jz4Eo64XCXQNTkf1idShiJVXSf4GVwB3BaET4',
              ].map(async (mint) => {
                const ata = await Token.getAssociatedTokenAddress(
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                  TOKEN_PROGRAM_ID,
                  new PublicKey(mint),
                  publicKey
                );

                const info =
                  await draffleClient.provider.connection.getAccountInfo(ata);
                if (info === null) {
                  await txHandler(async () => {
                    const tx = new Transaction({
                      feePayer: publicKey,
                    });
                    tx.add(
                      Token.createAssociatedTokenAccountInstruction(
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                        TOKEN_PROGRAM_ID,
                        new PublicKey(mint),
                        ata,
                        publicKey,
                        publicKey
                      )
                    );

                    return sender(connection, signTransaction, tx);
                  }, 'Token account created!');
                }
              });
              await sleep(1000);
              updateEmptyTokenAccountAddresses();
            }}
          >
            Create ATA
          </Button>
        )}
      </div>
    </Screen>
  );
};

const HowTo: FC = () => {
  const classes = { ...useCommonStyles(), ...useStyles() };
  return (
    <>
      {' '}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h3">What does it do?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className={classes.accordionContent}>
            <Typography variant="body1">
              Sending your precious NFT to Grandma's wallet for her birthday,
              listing an NFT on a marketplace, or spending your last few USDC on
              one of our upcoming dRaffles are all ordinary actions that leave
              an empty account cluttering your wallet, sometimes forever... At
              the dRaffle Luck Club, we like to keep things tidy, which is why
              we’ve created this simple and nifty tool to help you clean these
              up and regain{' '}
              <span className={classes.highlightPrimary}>
                proper wallet feng shui.
              </span>
            </Typography>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h3">Why should you care?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className={classes.accordionContent}>
            <ol>
              <Typography variant="body1">
                <li key={1}>
                  Although it is generally obscured behind a single fee
                  displayed to you by dApps, there is actually a cost (a.k.a
                  "rent") to opening and keeping open each token account:{' '}
                  {`${TOKEN_ACCOUNT_RENT_EXEMPTION_THRESHOLD}`} SOL. This sum is
                  paid by <span style={{ fontWeight: 'bold' }}>you</span> and is
                  locked in the account as long as it exists.{' '}
                  <span className={classes.highlightPrimary}>
                    Closing the accounts is the only way to get them SOL back!
                  </span>
                </li>
              </Typography>
              <Typography variant="body1">
                <li key={2}>
                  Wallets can get cluttered fast, especially if you regularly
                  buy/sell NFTs. A tidy wallet can prevent mistakes.
                </li>
              </Typography>
              <Typography variant="body1">
                <li key={3}>
                  Potential ASMR substitute if watching videos of sand being cut
                  is not enough anymore.
                </li>
              </Typography>
            </ol>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion className={classes.accordionItem}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h3">Is it safe?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className={classes.accordionContent}>
            <Typography variant="body1">
              Yes. Only empty accounts can be closed, and dApps handle accounts
              creation automatically whenever needed.{' '}
              <span className={classes.highlightPrimary}>
                If they don't it is a bug.
              </span>
            </Typography>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion className={classes.accordionItem}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h3">Disclaimer</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className={classes.accordionContent}>
            <Typography variant="body1">
              You should always send funds directly from exchanges to your
              wallet address,{' '}
              <span className={classes.highlightPrimary}>
                not to the token account address
              </span>
              . Make sure you haven't saved a token account address rather than
              a wallet address
            </Typography>
          </div>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default ToolsScreen;

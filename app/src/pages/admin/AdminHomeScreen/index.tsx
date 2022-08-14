import {
  Card,
  Grid,
  IconButton,
  Typography,
  useTheme,
} from '@material-ui/core';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Add } from '@material-ui/icons';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { useViewport } from '../../../hooks/useViewport';
import { DeviceType } from '../../../providers/ViewportProvider';
import Screen from '../../../components/layout/Screen';
import WalletButton from '../../../components/layout/WalletButton';
import Spacer from '../../../components/Spacer';
import { useRafflesStore } from '../../../hooks/useRafflesStore';
import { useProgramApis } from '../../../hooks/useProgramApis';
import { DispenserRegistryRaw } from '../../../providers/ProgramApisProvider';
import { routes } from '../../../router/routes';
import { useStyles } from './styles';
import {
  DISPENSER_REGISTRY_ADDRESS,
  DISPENSER_REGISTRY_KEYPAIR,
} from '../../../config/programIds';
import { shortenPubkeyString } from '../../../lib/utils';
import { VAULT_TOKEN_IN, VAULT_TOKEN_OUT } from '../../../config/accounts';
import AddPrizeModal from '../../../components/AddPrizeModal/AddPrizeModal';
import CreateRaffleModal from '../../../components/CreateRaffleModal/CreateRaffleModal';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { isAdmin } from '../../../components/AdminRoute';

const AdminHomeScreen: FC = () => {
  const classes = useStyles();
  const { connected, publicKey } = useWallet();
  const { push } = useHistory();
  const { device } = useViewport();
  const { raffles, fetchAllRaffles } = useRafflesStore();
  const { dispenserClient } = useProgramApis();
  const theme = useTheme();
  const [raffleIsOpen, setRaffleIsOpen] = useState(false);
  const [prizeIsOpen, setPrizeIsOpen] = useState(false);
  const [dispensers, setDispensers] = useState<
    { account: DispenserRegistryRaw; publicKey: PublicKey }[]
  >([]);

  useEffect(() => {
    fetchAllRaffles(true);
  }, [fetchAllRaffles]);

  useEffect(() => {
    dispenserClient.account.registry.all().then(setDispensers);
  }, [dispenserClient, setDispensers]);

  return (
    <div className={classes.root}>
      {connected && isAdmin(publicKey) ? (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="h3">Dispensers</Typography>
            <IconButton
              size={'small'}
              onClick={() => {
                dispenserClient.rpc
                  .createRegistry(new BN(500_000_000), new BN(1_000_000), {
                    accounts: {
                      registry: DISPENSER_REGISTRY_ADDRESS,
                      vaultTokenIn: VAULT_TOKEN_IN,
                      vaultTokenOut: VAULT_TOKEN_OUT,
                      admin: dispenserClient.provider.wallet.publicKey,
                      mintTokenIn: new PublicKey(
                        'So11111111111111111111111111111111111111112'
                      ),
                      mintTokenOut: new PublicKey(
                        'zRpVjG5wMWrNhpTtSiGMz9iBaMTQDdaVGCFLmYqCs4U'
                      ),
                      tokenProgram: TOKEN_PROGRAM_ID,
                      systemProgram: SystemProgram.programId,
                      rent: SYSVAR_RENT_PUBKEY,
                    },
                    signers: [DISPENSER_REGISTRY_KEYPAIR],
                  })
                  .then((res) => console.log(res));
              }}
            >
              <Add className={classes.scrollButtonIcon} />
            </IconButton>
          </div>
          <Spacer height={'20px'} />
          {dispensers.length === 0 ? (
            <>No dispenser found.</>
          ) : (
            <Grid container spacing={1} className={classes.raffleGrid}>
              {dispensers.map((dispenser) => (
                <Grid
                  key={dispenser.publicKey.toString()}
                  item
                  xs={3}
                  spacing={3}
                  className={classes.raffleGridItem}
                >
                  <Card className={classes.raffleCard}>
                    <Typography>
                      Admin: {shortenPubkeyString(dispenser.account.admin)}
                    </Typography>
                    <Typography>
                      In: {shortenPubkeyString(dispenser.account.mintTokenIn)}
                    </Typography>
                    <Typography>
                      {'->'} Vault:{' '}
                      {shortenPubkeyString(dispenser.account.vaultTokenIn)}
                    </Typography>
                    <Typography>
                      Out: {shortenPubkeyString(dispenser.account.mintTokenOut)}
                    </Typography>
                    <Typography>
                      {'->'} Vault:{' '}
                      {shortenPubkeyString(dispenser.account.vaultTokenOut)}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          <Spacer height={'20px'} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="h3">Ongoing raffles</Typography>
            <IconButton size={'small'} onClick={() => setRaffleIsOpen(true)}>
              <Add className={classes.scrollButtonIcon} />
            </IconButton>
            <CreateRaffleModal
              isOpen={raffleIsOpen}
              setIsOpen={setRaffleIsOpen}
            />
          </div>
          <Spacer height={'20px'} />
          <Grid container spacing={1} className={classes.raffleGrid}>
            {[...raffles.values()]
              .filter((raffle) => new Date() <= raffle.endTimestamp)
              .sort((a,b): any => (b.endTimestamp.getTime()/1000.0) - (a.endTimestamp.getTime()/1000.0))
              .map((raffle) => (
                <Grid
                  key={raffle.publicKey.toString()+"2"}
                  item
                  xs={3}
                  spacing={3}
                  className={classes.raffleGridItem}
                >
                  <Card
                    className={classes.raffleCard}
                  >
                    <Typography>{raffle.metadata.name}</Typography>
                    <Typography>{raffle.endTimestamp.toISOString()}</Typography>
                    <Spacer
                      height={device === DeviceType.Phone ? '5px' : '10px'}
                    />
                    <Typography
                      style={{ wordBreak: 'break-all', fontSize: '12px' }}
                    >
                      {raffle.publicKey.toBase58()}
                    </Typography>
                    <Spacer
                      height={device === DeviceType.Phone ? '5px' : '10px'}
                    />
                    <Typography
                      onClick={() =>
                        push(`${routes.ADMIN.RAFFLES}/${raffle.publicKey}`)
                      }
                      style={{
                        cursor: 'pointer',
                        color: theme.palette.primary.main,
                      }}
                    >
                      See Details
                    </Typography>
                    <Spacer
                      height={device === DeviceType.Phone ? '5px' : '10px'}
                    />
                    <div style={{ display: 'flex', height: '20px' }}>
                      <Typography>Add Prize </Typography>
                      <IconButton
                        size={'small'}
                        onClick={() => setPrizeIsOpen(true)}
                      >
                        <Add className={classes.scrollButtonIcon} />
                      </IconButton>
                    </div>
                    <AddPrizeModal
                      key={raffle.publicKey.toString()}
                      isOpen={prizeIsOpen}
                      setIsOpen={setPrizeIsOpen}
                      raffle={raffle}
                    />
                  </Card>
                </Grid>
              ))}
          </Grid>
          <Spacer height={'50px'} />
          <Typography variant="h3">Ended raffles</Typography>
          <Spacer height={'20px'} />
          <Grid container spacing={1} className={classes.raffleGrid}>
            {[...raffles.values()]
              .filter((raffle) => new Date() > raffle.endTimestamp)
              .sort((a,b): any => (b.endTimestamp.getTime()/1000.0) - (a.endTimestamp.getTime()/1000.0))
              .map((raffle) => (
                <Grid
                  key={raffle.publicKey.toString()}
                  item
                  xs={3}
                  spacing={3}
                  className={classes.raffleGridItem}
                >
                  <Card className={classes.raffleCard}>
                    <Typography>{raffle.metadata.name}</Typography>
                    <Typography>{raffle.endTimestamp.toISOString()}</Typography>
                    <Spacer
                      height={device === DeviceType.Phone ? '5px' : '10px'}
                    />
                    <Typography
                      style={{ wordBreak: 'break-all', fontSize: '12px' }}
                    >
                      {raffle.publicKey.toBase58()}
                    </Typography>
                    <Spacer
                      height={device === DeviceType.Phone ? '5px' : '10px'}
                    />
                    <Typography
                      onClick={() =>
                        push(`${routes.ADMIN.RAFFLES}/${raffle.publicKey}`)
                      }
                      style={{
                        cursor: 'pointer',
                        color: theme.palette.primary.main,
                      }}
                    >
                      See Details
                    </Typography>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </>
      ) : (
        <>
          <Typography variant="h3">
            Connect with an admin wallet to unlock admin panel
          </Typography>
          <div className={classes.walletButtonContainer}>
            <WalletButton />
          </div>
        </>
      )}
    </div>
  );
};

const AdminHomeScreenWithLayout = () => (
  <Screen>
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <AdminHomeScreen />
    </MuiPickersUtilsProvider>
  </Screen>
);

export default AdminHomeScreenWithLayout;

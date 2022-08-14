import { Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { Refresh } from '@material-ui/icons';
import { useWallet } from '@solana/wallet-adapter-react';
import { SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { isAdmin } from '../../../components/AdminRoute';
import Screen from '../../../components/layout/Screen';
import Spacer from '../../../components/Spacer';
import { useProgramApis } from '../../../hooks/useProgramApis';
import { useRafflesStore } from '../../../hooks/useRafflesStore';
import { closeEntrants } from '../../../lib/actions/closeEntrants';
import { collectProceeds } from '../../../lib/actions/collectProceeds';
import { txHandler } from '../../../lib/anchorUtils';
import { Raffle } from '../../../lib/types';
import { useStyles } from './styles';

const AdminRaffleScreen: FC = () => {
  const classes = useStyles();
  const { id: raffleId } = useParams<{ id: string }>();
  const { raffles, updateRaffleById } = useRafflesStore();
  const { draffleClient } = useProgramApis();
  const { connected, publicKey } = useWallet();
  const [currentRaffle, setCurrentRaffle] = useState<Raffle>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const raffle = raffles.get(raffleId);
    if (raffle) setCurrentRaffle(raffle);
  }, [raffles, raffleId]);

  const revealWinners = useCallback(async () => {
    await txHandler(
      () =>
        draffleClient.rpc.revealWinners({
          accounts: {
            raffle: raffleId,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
          }
        }),
        'Raffle revealed'
    )
  }, [draffleClient, raffleId]);

  const endRaffleEarly = useCallback(async () => {
    await txHandler(
      () =>
        draffleClient.rpc.endRaffleEarly({
          accounts: {
            raffle: raffleId,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
          }
        }),
        'Raffle has been ended early'
    )
  }, [draffleClient, raffleId]);

  const claimTokens = useCallback(async () => {
    if(currentRaffle === undefined) return;
    await txHandler(
      () =>
        collectProceeds(draffleClient, draffleClient.provider.wallet.publicKey, currentRaffle.proceeds.address, currentRaffle),
      'You have successfully claimed the raffle ticket tokens'
    );
  }, [currentRaffle, draffleClient]);

    const closeRaffle = useCallback(async () => {
    if(currentRaffle === undefined) return;
    await txHandler(
      () =>
        closeEntrants(draffleClient, draffleClient.provider.wallet.publicKey, currentRaffle),
      'Raffle account has been successfully closed'
    );
  }, [currentRaffle, draffleClient]);

  if (loading) {
    return (
      <div className={classes.root}>
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  if (!currentRaffle) return null;

  const createData = (
    wallet: string,
    tickets: string,
  ) => {
    return { wallet, tickets };
  }

  const generateRows = () => {
    let newRows = [...currentRaffle.entrants.entries()].map(([wallet, tickets]) => createData(wallet, tickets.tickets.toString()))
    return newRows
  }

  const rows = generateRows()

  return (
    <div className={classes.root}>
      {currentRaffle && connected && isAdmin(publicKey) ? (
        <>
          <div className={classes.headerContainer}>
            <Typography variant="h3">
              Entrants list (total {currentRaffle.entrants.size})
            </Typography>
            <IconButton
              onClick={() => {
                setLoading(true);
                updateRaffleById(raffleId);
                setLoading(false);
              }}
            >
              <Refresh />
            </IconButton>
          </div>
          <div>
            <Button onClick={revealWinners} variant="contained">
              Reveal winners
            </Button>
            <Button style={{marginLeft: 5}} onClick={endRaffleEarly} variant="contained">
              End Raffle Early
            </Button>
            <Button style={{marginLeft: 5}} onClick={claimTokens} variant="contained">
              Claim tokens
            </Button>
            <Button style={{marginLeft: 5}} onClick={closeRaffle} variant="contained">
              Close raffle
            </Button>
          </div>
          <Spacer height={'20px'} />
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entry Wallet</TableCell>
                  <TableCell align="right">Ticket Number(s)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.wallet}
                  >
                    <TableCell component="th" scope="row">
                      {row.wallet}
                    </TableCell>
                    <TableCell align="right" style={{wordBreak: "break-word", width: "33%"}}>{row.tickets}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography variant="h3">No entrants</Typography>
      )}
      <Spacer height={'50px'} />
    </div>
  );
};

const AdminRaffleScreenWithLayout = () => (
  <Screen>
    <AdminRaffleScreen />
  </Screen>
);

export default AdminRaffleScreenWithLayout;

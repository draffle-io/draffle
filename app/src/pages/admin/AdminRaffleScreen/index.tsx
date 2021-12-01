import { Button, IconButton, Typography } from '@material-ui/core';
import { Refresh } from '@material-ui/icons';
import { SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';

import Screen from '../../../components/layout/Screen';
import Spacer from '../../../components/Spacer';
import { useProgramApis } from '../../../hooks/useProgramApis';
import { useRafflesStore } from '../../../hooks/useRafflesStore';
import { txHandler } from '../../../lib/anchorUtils';
import { Raffle } from '../../../lib/types';
import { useStyles } from './styles';

const AdminRaffleScreen: FC = () => {
  const classes = useStyles();
  const { id: raffleId } = useParams<{ id: string }>();
  const { raffles, updateRaffleById } = useRafflesStore();
  const { draffleClient } = useProgramApis();

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

  if (loading) {
    return (
      <div className={classes.root}>
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  if (!currentRaffle) return null;

  return (
    <div className={classes.root}>
      {currentRaffle ? (
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
            <Button onClick={revealWinners} variant="contained">
              Reveal winners
            </Button>
          </div>
          <Spacer height={'20px'} />
          {[...currentRaffle.entrants.entries()].map(([wallet, tickets]) => (
            <div key={wallet} className={classes.entrantRow}>
              <Typography variant="body1">{wallet}: </Typography>
              <Typography variant="body1">
                {tickets.tickets.toString()}
              </Typography>
            </div>
          ))}
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

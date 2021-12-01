import React, { FC } from 'react';

import { Raffle } from '../../../../lib/types';
import useCommonStyles from '../../../../assets/styles';
import { useStyles } from './styles';
import PrizeCardEnded from '../PrizeCardEnded';
import { Grid } from '@material-ui/core';

export interface PrizeShowcaseEndedProps {
  raffle: Raffle;
  winningTickets?: number[];
}

export const PrizeShowcaseEnded: FC<PrizeShowcaseEndedProps> = ({
  raffle,
  winningTickets = [],
}) => {
  const classes = { ...useCommonStyles(), ...useStyles() };

  if (raffle.prizes.length === 0)
    return <div className={classes.root}>No prizes</div>;

  if (raffle.prizes.length === 1) {
    return (
      <div className={classes.root}>
        <Grid
          container
          justifyContent={'space-evenly'}
          direction={'row'}
          className={classes.prizesGrid}
        >
          <Grid item>
            <PrizeCardEnded
              prize={raffle.prizes[0]}
              raffle={raffle}
              winner={winningTickets[0]}
              className={classes.prizeItem}
            />
          </Grid>
        </Grid>
      </div>
    );
  }

  if (raffle.prizes.length === 2) {
    return (
      <div className={classes.root}>
        <Grid
          container
          justifyContent={'space-evenly'}
          direction={'row'}
          className={classes.prizesGrid}
        >
          <Grid item>
            <PrizeCardEnded
              prize={raffle.prizes[0]}
              index={0}
              raffle={raffle}
              winner={winningTickets[0]}
              className={classes.prizeItem}
            />
          </Grid>
          <Grid item>
            <PrizeCardEnded
              prize={raffle.prizes[1]}
              index={1}
              raffle={raffle}
              winner={winningTickets[1]}
              className={classes.prizeItem}
            />
          </Grid>
        </Grid>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Grid
        container
        justifyContent={'space-evenly'}
        direction={'row'}
        className={classes.prizesGrid}
      >
        <Grid item>
          <PrizeCardEnded
            prize={raffle.prizes[0]}
            index={0}
            raffle={raffle}
            winner={winningTickets[0]}
            className={classes.prizeItem}
          />
        </Grid>
        <Grid item>
          <PrizeCardEnded
            prize={raffle.prizes[1]}
            index={1}
            raffle={raffle}
            winner={winningTickets[1]}
            className={classes.prizeItem}
          />
        </Grid>
        <Grid item>
          <PrizeCardEnded
            prize={raffle.prizes[2]}
            index={2}
            raffle={raffle}
            winner={winningTickets[2]}
            className={classes.prizeItem}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default PrizeShowcaseEnded;

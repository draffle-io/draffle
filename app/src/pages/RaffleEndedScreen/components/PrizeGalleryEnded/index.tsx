import { FC, RefObject, useEffect } from 'react';
import { Grid } from '@material-ui/core';

import { Raffle } from '../../../../lib/types';
import ClaimButton from '../../../../components/ClaimButton';
import PrizeCardEnded from '../PrizeCardEnded';
import useCommonStyles from '../../../../assets/styles';
import { useStyles } from './styles';
import { useViewport } from '../../../../hooks/useViewport';
import { DeviceType } from '../../../../providers/ViewportProvider';

interface PrizeGalleryEndedProps {
  raffle: Raffle;
  entrantWinningTickets: { prizeIndex: number; ticketIndex: number }[];
  winningTickets: number[];
  claimPrize: (prizeIndex: number, ticketIndex: number) => Promise<void>;
  scrollRef: RefObject<HTMLDivElement>;
}

const PrizeGalleryEnded: FC<PrizeGalleryEndedProps> = ({
  raffle,
  entrantWinningTickets,
  winningTickets,
  claimPrize,
  scrollRef,
}) => {
  const { device } = useViewport();
  const classes = { ...useCommonStyles(), ...(useStyles({ device }) as any) };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={classes.root}>
      <Grid
        ref={scrollRef}
        container
        justifyContent={'space-between'}
        direction={device === DeviceType.Phone ? 'column' : 'row'}
        className={classes.prizesGrid}
      >
        {raffle.prizes.map((prize, prizeIndex) => {
          const ticketIndex = winningTickets[prizeIndex];
          const isWon = entrantWinningTickets.some(
            (entrantWinningTicket) =>
              entrantWinningTicket.ticketIndex === ticketIndex
          );

          return (
            <Grid key={prizeIndex} item className={classes.prizeItem}>
              <PrizeCardEnded
                key={prizeIndex}
                prize={prize}
                raffle={raffle}
                {...(prize.amount.isZero() ? { badgeText: 'Claimed' } : {})}
                index={prizeIndex}
                winner={ticketIndex}
              />
              {isWon && (
                <div className={classes.claimButtonContainer}>
                  <ClaimButton
                    claimPrize={claimPrize}
                    prize={prize}
                    prizeIndex={prizeIndex}
                    ticketIndex={ticketIndex}
                  />
                </div>
              )}
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};

export default PrizeGalleryEnded;

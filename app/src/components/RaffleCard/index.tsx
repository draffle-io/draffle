import React, { FC, HTMLAttributes, useEffect, useState } from 'react';
import {
  Card,
  CardActions,
  CardMedia,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { ArrowForward } from '@material-ui/icons';
import { useHistory } from 'react-router';

import { PrizeType, Raffle } from '../../lib/types';
import { routes } from '../../router/routes';
import Countdown from '../Countdown';
import { getDisplayAmount } from '../../lib/accounts';
import { useStyles } from './styles';
import { useViewport } from '../../hooks/useViewport';

export interface RaffleCardProps extends HTMLAttributes<HTMLDivElement> {
  raffle: Raffle;
}

const MAX_TITLE_LENGTH = 20;

const RaffleCard: FC<RaffleCardProps> = ({
  raffle,
  className,
  ...otherProps
}) => {
  const { device } = useViewport();
  const classes = useStyles({ device });
  const { push } = useHistory();
  const [isEnded, setIsEnded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timerId = setInterval(
      () => setIsEnded(new Date() < raffle.endTimestamp),
      1000
    );
    return () => clearInterval(timerId);
  }, [raffle, setIsEnded]);

  if (raffle.prizes.length === 0) return null;

  const prize = raffle.prizes[0];
  const imageUrl =
    raffle.metadata.overviewImageUri
      ? raffle.metadata.overviewImageUri
      : prize.meta.imageUri;

  return (
    <Card
      onClick={() => {
        push(`${routes.RAFFLES}/${raffle.publicKey}`);
      }}
      className={`${classes.root} ${className}`}
      {...otherProps}
    >
      <div className={classes.cardPrizesBadge}>
        {raffle.prizes.length} prize{raffle.prizes.length > 1 && 's'}
      </div>
      {new Date() > raffle.endTimestamp && (
        <div className={classes.cardEndedBadge}>Ended</div>
      )}
      {!isLoaded && (
        <Skeleton
          variant="rect"
          animation={'wave'}
          classes={{
            root: classes.media,
          }}
        />
      )}
      <CardMedia
        component="img"
        className={classes.media}
        src={imageUrl}
        alt={prize.mint.name}
        style={isLoaded ? {} : { display: 'none' }}
        onLoad={() => setIsLoaded(true)}
      />

      <CardActions className={classes.raffleInfo}>
        <div className={classes.detailsRow1}>
          {raffle.metadata.name.length > MAX_TITLE_LENGTH ? (
            <Tooltip title={raffle.metadata.name} placement="top">
              <div>{raffle.metadata.name.slice(0, MAX_TITLE_LENGTH - 4)} ...</div>
            </Tooltip>
          ) : (
            raffle.metadata.name
          )}
        </div>
        <div className={classes.detailsRow2}>
          <div className={classes.ticketsSold}>
            <div className={classes.label}>
              <span className={classes.cardLabel}>Tickets sold</span>
            </div>
            {raffle.totalTickets}
          </div>
          <div className={classes.endingIn}>
            <div className={classes.label}>
              <span className={classes.cardLabel}>Ending in</span>
            </div>
            {isEnded ? <Countdown endTimestamp={raffle.endTimestamp} /> : '-'}
          </div>
        </div>
        <div className={classes.detailsRow3}>
          <div className={classes.ticketPrice}>
            <div className={classes.label}>
              <span className={classes.cardLabel}>Ticket price</span>
            </div>
            {getDisplayAmount(
              raffle.proceeds.ticketPrice,
              raffle.proceeds.mint
            )}{' '}
            {raffle.proceeds.mint.symbol}
          </div>
          <div>
            <IconButton className={classes.goToRaffle}>
              <ArrowForward />
            </IconButton>
          </div>
        </div>
      </CardActions>
    </Card>
  );
};

export default RaffleCard;

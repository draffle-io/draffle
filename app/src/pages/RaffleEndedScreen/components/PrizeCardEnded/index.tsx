import React, { FC, useMemo, useState } from 'react';
import {
  Card,
  CardActions,
  CardClassKey,
  CardMedia,
  PaperProps,
  StandardProps,
  Typography,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import { Prize, PrizeType, Raffle } from '../../../../lib/types';
import useRandomDrawer from '../../../../hooks/useRandomDrawer';
import useCommonStyles from '../../../../assets/styles';
import { useStyles } from './styles';
import { shortenPubkeyString } from '../../../../lib/utils';
import { useViewport } from '../../../../hooks/useViewport';
import ShortenedString from '../../../../components/ShortenedString';
import { DeviceType } from '../../../../providers/ViewportProvider';
import PrizeDetailsModal from '../../../../components/PrizeDetailsModal';

export interface PrizeCardEndedProps
  extends StandardProps<PaperProps, CardClassKey> {
  prize: Prize;
  raffle: Raffle;
  index?: number;
  badgeText?: string;
  winner?: number;
}

const RandomTicketDrawer: FC<{ endRange: number }> = ({ endRange }) => {
  const randomTicket = useRandomDrawer({ endRange });
  return <>#{String((randomTicket || 0) + 1).padStart(4, '0')}</>;
};

const PrizeCardEnded: FC<PrizeCardEndedProps> = ({
  prize,
  raffle,
  index,
  badgeText,
  winner,
  className,
  ...otherProps
}) => {
  const { device } = useViewport();
  const classes = { ...useCommonStyles(), ...(useStyles({ device }) as any) };
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageUrl = prize.meta.imageUri;

  const maxPrizeNameLength = useMemo(
    () => (device === DeviceType.Phone ? 14 : 18),
    [device]
  );

  return (
    <>
      <PrizeDetailsModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        prize={prize}
        prizeRank={index}
      />
      <Card
        onClick={() => {
          setIsModalOpen(true);
        }}
        {...otherProps}
        className={`${classes.root} ${className}`}
      >
        {badgeText && <div className={classes.cardBadge}>{badgeText}</div>}
        {!isLoaded && (
          <div>
            <Skeleton
              variant="rect"
              animation={'wave'}
              classes={{
                root: classes.media,
              }}
            />
          </div>
        )}
        <CardMedia
          component="img"
          className={classes.media}
          src={imageUrl}
          alt={prize.mint.name}
          style={isLoaded ? {} : { display: 'none' }}
          onLoad={() => setIsLoaded(true)}
        />
        <CardActions className={classes.prizeInfo}>
          <div className={classes.prizeInfoInner}>
            <div className={classes.prizeNameRow}>
              <Typography variant="body1">
                {index !== undefined && `#${index + 1} `}
              </Typography>
              <Typography variant="body1" className={classes.prizeName}>
                <ShortenedString
                  message={prize.mint.name}
                  maxCharLength={maxPrizeNameLength}
                  addTooltip
                />
              </Typography>
            </div>
            <div className={classes.winnerSection}>
              {winner !== undefined ? (
                <div>
                  <Typography variant="body1">{`Winner: #${String(
                    winner + 1
                  ).padStart(4, '0')}`}</Typography>
                  <div className={classes.winnerRow}>
                    <Typography variant="body1">Pubkey: </Typography>
                    <Typography
                      variant="body1"
                      className={classes.winnerPubkey}
                    >
                      {shortenPubkeyString(raffle.entrantsRaw[winner])}
                    </Typography>
                  </div>
                </div>
              ) : (
                <>
                  <Typography variant="body1">Drawing...</Typography>
                  <Typography variant="body1" className={classes.winnertTicket}>
                    <RandomTicketDrawer endRange={raffle.totalTickets} />
                  </Typography>
                </>
              )}
            </div>
          </div>
        </CardActions>
      </Card>
    </>
  );
};

export default PrizeCardEnded;

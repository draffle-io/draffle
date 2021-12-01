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

import { Prize, PrizeType } from '../../../../lib/types';
import { useStyles } from './styles';
import { useViewport } from '../../../../hooks/useViewport';
import ShortenedString from '../../../../components/ShortenedString';
import { DeviceType } from '../../../../providers/ViewportProvider';
import PrizeDetailsModal from '../../../../components/PrizeDetailsModal';

export interface PrizeCardOngoingProps
  extends StandardProps<PaperProps, CardClassKey> {
  prize: Prize;
  index?: number;
}

const PrizeCardOngoing: FC<PrizeCardOngoingProps> = ({
  prize,
  index,
  className,
  ...otherProps
}) => {
  const { device } = useViewport();
  const classes = useStyles({ device });
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
          classes={{
            root: classes.media,
          }}
          src={imageUrl}
          alt={prize.mint.name}
          style={isLoaded ? {} : { display: 'none' }}
          onLoad={() => setIsLoaded(true)}
        />
        <CardActions className={classes.prizeInfo}>
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
        </CardActions>
      </Card>
    </>
  );
};

export default PrizeCardOngoing;

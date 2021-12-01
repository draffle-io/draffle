import { FC, RefObject, useEffect } from 'react';
import { Grid } from '@material-ui/core';

import { Raffle } from '../../../../lib/types';
import PrizeCardOngoing from '../PrizeCardOngoing';
import useCommonStyles from '../../../../assets/styles';
import { useStyles } from './styles';
import { useViewport } from '../../../../hooks/useViewport';
import { DeviceType } from '../../../../providers/ViewportProvider';

interface PrizeGalleryProps {
  raffle: Raffle;
  scrollRef: RefObject<HTMLDivElement>;
}

const PrizeGallery: FC<PrizeGalleryProps> = ({ raffle, scrollRef }) => {
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
          return (
            <Grid item>
              <PrizeCardOngoing
                key={prizeIndex}
                className={classes.prizeItem}
                prize={prize}
                index={prizeIndex}
              />
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};

export default PrizeGallery;

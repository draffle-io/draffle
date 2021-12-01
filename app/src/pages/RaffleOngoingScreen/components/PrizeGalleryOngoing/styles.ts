import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { DeviceType } from '../../../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    root: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    prizesGrid: {
      scrollMargin: '130px',
      display: 'flex',
      width: '100%',
      marginTop: '5px',
    },
    prizeItem: ({ device }) => ({
      marginBottom: device === DeviceType.Phone ? '10px' : '30px',
    }),
  })
);

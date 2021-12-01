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
    prizesGrid: ({ device }) => ({
      scrollMargin: '130px',
      display: 'flex',
      justifyContent: 'space-around',
      flexGrow: 'initial',
      width: '100%',
      marginTop: device === DeviceType.Phone ? '-20px' : '5px',
    }),
    prizeItem: ({ device }) => ({
      margin: device === DeviceType.Phone ? '0' : '10px',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: device === DeviceType.Phone ? '30px' : '0',
      marginBottom: device === DeviceType.Phone ? '0' : '30px',
    }),
    claimButtonContainer: ({ device }) => ({
      ...(device === DeviceType.Phone ? { height: '25px' } : {}),
      marginTop: device === DeviceType.Phone ? '8px' : '10px',
    }),
  })
);

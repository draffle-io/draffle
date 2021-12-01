import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { DeviceType } from '../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    root: ({ device }) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      margin: device === DeviceType.Phone ? '20px 0' : '-20px 0',
    }),
    socialLinksContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: '30px',
    },
    socialLinkContainer: ({ device }) => ({
      height: '50px',
      width: '80px',
      margin: device === DeviceType.Phone ? '0 5px' : '0 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }),
    socialLink: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '30px',
      width: '250px',
    },
  })
);

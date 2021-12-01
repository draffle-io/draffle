import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { DeviceType } from '../../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      paddingTop: '30px',
    },
    socialLink: {
      height: '50px',
      margin: '0 20px',
    },
  })
);

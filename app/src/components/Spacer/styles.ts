import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DeviceType } from '../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    root: ({ device }) => ({
      position: 'fixed',
      bottom: device === DeviceType.Phone ? 20 : 30,
      right: device === DeviceType.Phone ? 20 : 30,
    }),
    scrollButton: {
      color: theme.palette.common.black,
      backgroundColor: theme.palette.secondary.main,
      border: `2px solid ${theme.palette.secondary.main}`,
      '&:hover': {
        boxShadow: `0px 0px 10px ${theme.palette.secondary.main}, inset 0px 0px 5px ${theme.palette.secondary.main}`,
        backgroundColor: theme.palette.secondary.main,
      },
    },
    scrollButtonIcon: {
      transform: `rotate(-90deg)`,
    },
  })
);

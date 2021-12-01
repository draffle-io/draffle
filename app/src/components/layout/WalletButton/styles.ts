import { Theme, alpha } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles<Theme>((theme: Theme) => ({
  walletConnectButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: theme.palette.common.white,
    boxShadow: '0 0 5px 2px #e86bff, inset 0 0 10px 0px #e86bff',
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      borderColor: theme.palette.common.white,
    },
  },
  walletDisconnectButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: theme.palette.common.white,
    boxShadow: `0 0 5px 2px ${theme.palette.secondary.main}, inset 0 0 10px 0px ${theme.palette.secondary.main}`,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: alpha(theme.palette.secondary.main, 0.2),
      borderColor: theme.palette.common.white,
    },
  },
}));

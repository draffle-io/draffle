import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles<Theme>((theme: Theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    backgroundColor: 'rgba(57,9,74,1)',
  },
  drawerHeader: {
    marginLeft: '10px',
    height: '50px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
  },
  drawerContent: {
    width: '100vw',
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletButtonContainer: {
    width: '76%',
    maxWidth: '245px',
    display: 'flex',
    justifyContent: 'center',
  },
  navButtonsContainer: {
    width: '100%',
    marginTop: '30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
}));

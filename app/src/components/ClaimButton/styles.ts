import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: '100%',
  },
  claimButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonContentLeft: {
    width: '20%',
    display: 'flex',
    justifyContent: 'center',
  },
  claimButtonContentMiddle: {
    width: '80%',
  },
  claimButtonContentRight: {
    width: '0%',
  },
  claimSpinner: {
    height: '50px',
    color: theme.palette.secondary.main,
  },
}));

import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  prizesGrid: {
    display: 'flex',
    flexGrow: 'initial',
    width: '100%',
  },
  prizeItem: {
    margin: '0 5px 30px 5px',
  },
  claimButtonContainer: {
    marginTop: '20px',
  },
  claimButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
}));

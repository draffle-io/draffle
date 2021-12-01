import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    maxWidth: '900px',
    justifyContent: 'space-between',
  },
}));

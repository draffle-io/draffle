import { Theme, alpha, darken } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => ({
  label: {
    textAlign: 'left',
  },
  value: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    verticalAlign: 'center',
  },
  actionSection: {
    padding: '5px 5px',
    minHeight: '180px',
    width: '100%',
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    borderRadius: '4px',
    boxShadow: '0 2px 4px 0 #000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  mainButton: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: darken(theme.palette.primary.main, 0.2),
      borderColor: darken(theme.palette.primary.main, 0.2),
    },
    '&:disabled': {
      backgroundColor: '#393939',
      borderColor: '#393939',
      color: '#898989',
    },
  },
}));

export default useStyles;

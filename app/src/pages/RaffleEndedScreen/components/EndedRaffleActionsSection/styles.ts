import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => ({
  textHighlight: {
    marginBottom: '10px',
  },
  scrollLink: {
    textTransform: 'none',
    marginRight: '-5px',
    color: theme.palette.primary.main,
    '&:hover': {
      textShadow: '0px 0px 5px #e86bff',
      backgroundColor: 'transparent',
      textDecoration: 'none',
    },
  },
  scrollIcon: {
    transform: `rotate(90deg)`,
    fontSize: '50px',
    opacity: '0.6',
    marginTop: '20px',
    marginBottom: '60px',
  },
  connectToBuyButton: {
    marginTop: '20px',
    width: '80%',
    height: '40px',
  },
}));

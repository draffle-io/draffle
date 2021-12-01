import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DeviceType } from '../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    root: ({ device }) => ({
      height: '420px',
      width: '280px',
      position: 'relative',
      cursor: 'pointer',
      '&:hover': {
        boxShadow: '0 3px 10px 0 #111',
        transform: 'scale3d(1.02, 1.02, 1)',
      },
      '&:active': {
        transform: 'scale3d(1, 1, 1)',
      },
    }),
    media: {
      height: '250px',
      minHeight: '250px',
    },
    raffleInfo: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      fontSize: '18px',
      padding: '15px',
    },
    cardLabel: {
      fontSize: '15px',
    },
    detailsRow1: {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: '10px',
    },
    detailsRow2: {
      color: theme.palette.common.white,
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      marginBottom: '10px',
    },
    detailsRow3: {
      color: theme.palette.common.white,
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
    },
    label: {
      fontSize: '10px',
      color: '#777',
    },
    ticketsSold: {
      width: '50%',
    },
    endingIn: {
      width: '50%',
    },
    ticketPrice: {
      width: '80%',
    },
    goToRaffle: {
      color: 'white',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    cardPrizesBadge: {
      fontSize: '12px',
      fontWeight: 'bold',
      width: '80px',
      textAlign: 'center',
      padding: '2px',
      position: 'absolute',
      top: '5px',
      left: '5px',
      color: 'black',
      backgroundColor: theme.palette.secondary.main,
      borderRadius: '2px',
      boxShadow: '0 2px 6px 0 #000',
    },
    cardEndedBadge: {
      fontSize: '12px',
      fontWeight: 'bold',
      width: '50px',
      textAlign: 'center',
      padding: '2px',
      position: 'absolute',
      top: '5px',
      right: '5px',
      color: 'white',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '2px',
      boxShadow: '0 2px 6px 0 #000',
    },
  })
);

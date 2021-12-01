import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DeviceType } from '../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    root: ({ device }) => ({
      width: '100%',
      minWidth: device === DeviceType.Phone ? '256px' : '313px',
      maxWidth: device === DeviceType.Phone ? '380px' : '380px',
      display: 'flex',
      flexDirection: 'column',
      fontSize: '30px',
    }),
    ticketsSection: {
      display: 'flex',
      flexDirection: 'row',
    },
    totalTickets: {
      width: '58%',
    },
    ticketPrice: {
      width: '42%',
    },
    myTickets: {
      width: '55%',
    },
    showMyTickets: {
      width: '45%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'baseline',
      paddingBottom: '5px',
    },
    ticketButton: {
      fontSize: '14px',
      color: theme.palette.primary.main,
      textShadow: '0px 0px 5px #e86bff',
      padding: '0 0',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    separator: { margin: '0 5px' },
  })
);

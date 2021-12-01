import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { DeviceType } from '../../../../providers/ViewportProvider';

export const useStyles = makeStyles<Theme, { device: DeviceType }>(
  (theme: Theme) => ({
    filterBar: ({ device }) => ({
      width: '100%',
      display: 'flex',
      flexDirection: device === DeviceType.Phone ? 'column' : 'row',
      alignItems: 'center',
      marginBottom: '30px',
      justifyContent: 'space-between',
    }),
    leftSection: {
      width: '25%',
    },
    middleSection: {
      width: '50%',
      display: 'flex',
      justifyContent: 'center',
    },
    rightSection: {
      width: '25%',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    leftPhoneSection: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    rightPhoneSection: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    ownRafflesSwitchContainer: {
      display: 'flex',
      justifyContent: 'center',
      width: 200,
      height: 30,
      border: '2px solid white',
      borderRadius: '2px',
      boxShadow: '0 0 5px 0 #e86bff',
    },
    showEndedRaffles: {
      display: 'flex',
      alignItems: 'center',
    },
    showEndedRafflesCheckbox: {
      color: theme.palette.primary.main,
      '&.Mui-checked': {
        color: theme.palette.primary.main,
      },
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    hideEndedText: {
      color: 'white',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  })
);

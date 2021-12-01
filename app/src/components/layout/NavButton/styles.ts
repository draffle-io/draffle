import { Theme } from '@material-ui/core';
import { makeStyles, darken } from '@material-ui/core/styles';

export const useStyles = makeStyles<Theme, { isCurrent: boolean }>(
  (theme: Theme) => ({
    navButtons: ({ isCurrent }) => ({
      fontSize: '16px',
      color: isCurrent
        ? darken(theme.palette.secondary.main, 0.1)
        : theme.palette.primary.main,
      '&:hover': {
        textShadow: '0px 0px 5px #e86bff',
        backgroundColor: 'transparent',
      },
    }),
  })
);

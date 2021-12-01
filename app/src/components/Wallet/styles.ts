import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles<Theme>((theme: Theme) => ({
  '& root .MuiDialogTitle-root .MuiIconButton-root': {
    color: theme.palette.common.white,
  },
}));

import React, { FC } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/styles';

import theme from '../assets/theme';
import { useViewport } from '../hooks/useViewport';

const ThemeProvider: FC = ({ children }) => {
  const { device } = useViewport();

  return (
    <MuiThemeProvider theme={theme({ device })}>{children}</MuiThemeProvider>
  );
};

export default ThemeProvider;

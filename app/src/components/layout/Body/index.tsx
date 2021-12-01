import { Box, Container } from '@material-ui/core';
import React, { FC } from 'react';
import { useViewport } from '../../../hooks/useViewport';

import { useStyles } from './styles';

export interface BodyProps {}

export const Body: FC<BodyProps> = ({ children }) => {
  const { device } = useViewport();
  const classes = useStyles({ device });
  return (
    <Container
      style={{
        width: '90%',
        padding: '0 10px',
        display: ' flex',
        alignItems: 'center',
      }}
    >
      <Box className={classes.root}>{children}</Box>
    </Container>
  );
};

export default Body;

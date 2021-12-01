import React, { FC } from 'react';

import { useStyles } from './styles';

export interface BaseProps {}

export const Base: FC<BaseProps> = ({ children }) => {
  const classes = useStyles();
  return (
    <>
      <div className={classes.background}></div>
      <div className={classes.content}>{children}</div>
    </>
  );
};

export default Base;

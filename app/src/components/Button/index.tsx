import React, { FC } from 'react';
import { Button as MuiButton, ButtonProps } from '@material-ui/core';

export const Button: FC<ButtonProps> = ({ children, ...otherProps }) => {
  return <MuiButton {...otherProps}>{children}</MuiButton>;
};

export default Button;

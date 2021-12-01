import React, { FC } from 'react';
import { Button, ButtonProps } from '@material-ui/core';
import { useHistory } from 'react-router';

import { useStyles } from './styles';

export interface NavButtonProps extends ButtonProps {
  label: string;
  target: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  size?: 'medium' | 'large' | 'small' | undefined;
  isCurrent?: boolean;
}

const NavButton: FC<NavButtonProps> = ({
  label,
  target,
  onClick,
  size,
  isCurrent = false,
  className,
  ...otherProps
}) => {
  const classes = useStyles({ isCurrent });
  const { push } = useHistory();

  return (
    <Button
      onClick={(event) => {
        push(target);
        if (onClick) onClick(event);
      }}
      variant="text"
      disableRipple
      size={size}
      className={`${classes.navButtons} ${className}`}
      {...otherProps}
    >
      {label}
    </Button>
  );
};

export default NavButton;

import React, { FC } from 'react';
import { IconButton, SwipeableDrawer } from '@material-ui/core';
import { Close } from '@material-ui/icons';

import WalletButton from '../WalletButton';
import { useStyles } from './styles';
import NavButton from '../NavButton';
import { useLocation } from 'react-router';
import { isAdmin } from '../../AdminRoute';
import { PublicKey } from '@solana/web3.js';

export interface DrawerProps {
  wallet: PublicKey | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navLinksList: { label: string; target: string; admin?: boolean }[];
}

const Drawer: FC<DrawerProps> = ({
  wallet,
  isOpen,
  setIsOpen,
  navLinksList,
}) => {
  const classes = useStyles();
  const { pathname } = useLocation();

  return (
    <SwipeableDrawer
      anchor={'left'}
      className={classes.root}
      classes={{ paper: classes.paper }}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
    >
      <div className={classes.drawerHeader}>
        <IconButton size={'medium'} onClick={() => setIsOpen(false)}>
          <Close />
        </IconButton>
      </div>
      <div className={classes.drawerContent}>
        <div className={classes.walletButtonContainer}>
          <WalletButton />
        </div>
        <div className={classes.navButtonsContainer}>
          {navLinksList
            .filter(({ admin }) => !admin || (admin && isAdmin(wallet)))
            .map((navLink) => (
              <NavButton
                label={navLink.label}
                target={navLink.target}
                onClick={() => setIsOpen(false)}
                isCurrent={navLink.target === pathname}
              />
            ))}
        </div>
      </div>
    </SwipeableDrawer>
  );
};

export default Drawer;

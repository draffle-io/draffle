import React, { FC } from 'react';
import {
  Backdrop,
  Button,
  Fade,
  IconButton,
  Modal,
  Typography,
} from '@material-ui/core';

import { useViewport } from '../../hooks/useViewport';
import { Prize, PrizeType } from '../../lib/types';
import { useStyles } from './styles';
import { shortenPubkeyString } from '../../lib/utils';
import { Close, Launch } from '@material-ui/icons';
import Spacer from '../Spacer';
import { DeviceType } from '../../providers/ViewportProvider';

interface PrizeDetailsModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  prize: Prize;
  prizeRank?: number;
}

const PrizeDetailsModal: FC<PrizeDetailsModalProps> = ({
  isOpen,
  setIsOpen,
  prize,
  prizeRank,
}) => {
  const { device } = useViewport();
  const classes = useStyles({ device });

  const imageUrl = prize.meta.imageUri

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      className={classes.modal}
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={isOpen}>
        <div className={classes.content}>
          <div className={classes.header}>
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <Close />
            </IconButton>
          </div>
          <div className={classes.body}>
            <div className={classes.contentLeft}>
              <img
                src={imageUrl}
                className={classes.media}
                alt={prize.mint.name}
              />
            </div>
            <div className={classes.contentRight}>
              <div>
                <Typography variant="overline">Codename</Typography>
                <Typography variant="body1">{prize.mint.name}</Typography>
              </div>
              <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
              {prizeRank !== undefined && (
                <>
                  <div>
                    <Typography variant="overline">Prize rank</Typography>
                    <Typography variant="body1">{prizeRank + 1}</Typography>
                  </div>
                  <Spacer
                    height={device === DeviceType.Phone ? '5px' : '10px'}
                  />
                </>
              )}
              <div>
                <Typography variant="overline">Mint address</Typography>
                <Typography variant="body1">
                  {shortenPubkeyString(prize.mint.publicKey)}
                </Typography>
              </div>
              <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
              <Button
                variant="text"
                size="small"
                disableRipple
                onClick={() => {
                  var win = window.open(
                    `https://solscan.io/token/${prize.mint.publicKey.toString()}`,
                    '_blank'
                  );
                  win?.focus();
                }}
                className={classes.ticketButton}
              >
                See on Solscan{' '}
                <Launch
                  style={{
                    height: '17px',
                    marginLeft: '5px',
                  }}
                />
              </Button>
            </div>
          </div>
        </div>
      </Fade>
    </Modal>
  );
};

export default PrizeDetailsModal;

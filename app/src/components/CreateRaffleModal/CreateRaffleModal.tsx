import React, { FC, useCallback } from 'react';
import {
  Button,
  IconButton,
  Dialog,
  Typography,
  DialogContent,
  TextField,
  Link,
} from '@material-ui/core';

import { useViewport } from '../../hooks/useViewport';
import { useStyles } from './styles';
import { Close } from '@material-ui/icons';
import Spacer from '../Spacer';
import { DeviceType } from '../../providers/ViewportProvider';
import { createRaffle } from '../../lib/actions/createRaffle';
import { useProgramApis } from '../../hooks/useProgramApis';
import { PublicKey } from '@solana/web3.js';
import { txHandler } from '../../lib/anchorUtils';

interface CreateRaffleModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateRaffleModal: FC<CreateRaffleModalProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const { device } = useViewport();
  const classes = useStyles({ device });
  const { draffleClient } = useProgramApis();

  const handleClose = () => {
    setIsOpen(false);
  };

  // Execture function, submit form, clear data
  const handleRaffle = useCallback(
    async (e: any) => {
      e.preventDefault();

      // Use handler to give nice toast message
      await txHandler(
        () =>
          createRaffle(
            draffleClient,
            draffleClient.provider.wallet.publicKey,
            new PublicKey(e.target.tokenMint.value),
            e.target.endTimestamp.value,
            e.target.ticketCost.value,
            e.target.maxEntrants.value
          ),
        `Raffle created successfully!`
      );

      e.target.tokenMint.value = '';
      e.target.ticketCost.value = '';
      e.target.maxEntrants.value = '';
      e.target.endTimestamp.value = '';
      setIsOpen(false);
    },
    [draffleClient, setIsOpen]
  );

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        handleClose();
      }}
      className={classes.modal}
    >
      <div>
        <div className={classes.header}>
          <IconButton size="small" onClick={() => setIsOpen(false)}>
            <Close />
          </IconButton>
        </div>
        <DialogContent>
          <form onSubmit={handleRaffle}>
            <Typography variant="overline">Token Mint ID</Typography>
            <TextField
              autoFocus
              margin="dense"
              id="tokenMint"
              type="text"
              fullWidth
              variant="standard"
            />
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Typography variant="overline">Raffle Ticket Cost</Typography>
            <TextField
              margin="dense"
              id="ticketCost"
              type="text"
              fullWidth
              variant="standard"
            />
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Typography variant="overline">Max # of Entrants</Typography>
            <TextField
              margin="dense"
              id="maxEntrants"
              type="text"
              fullWidth
              variant="standard"
            />
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Typography variant="overline">
              End Timestamp of Raffle (
              {
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href="https://www.epochconverter.com/"
                >
                  Epoch Timestamp
                </Link>
              }
              )
            </Typography>
            <TextField
              margin="dense"
              id="endTimestamp"
              type="text"
              fullWidth
              variant="standard"
            />
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Button type="submit">Create Raffle</Button>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default CreateRaffleModal;

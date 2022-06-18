import React, { FC, useCallback } from 'react';
import {
  Button,
  IconButton,
  Dialog,
  Typography,
  DialogContent,
  TextField,
} from '@material-ui/core';

import { useViewport } from '../../hooks/useViewport';
import { Raffle } from '../../lib/types';
import { useStyles } from './styles';
import { Close } from '@material-ui/icons';
import Spacer from '../Spacer';
import { DeviceType } from '../../providers/ViewportProvider';
import { useProgramApis } from '../../hooks/useProgramApis';
import { txHandler } from '../../lib/anchorUtils';
import { addPrize } from '../../lib/actions/addPrize';
import { PublicKey } from '@solana/web3.js';

interface AddPrizeModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  raffle: Raffle;
}

const AddPrizeModal: FC<AddPrizeModalProps> = ({ isOpen, setIsOpen, raffle }) => {
  const { device } = useViewport();
  const classes = useStyles({ device });
  const { draffleClient } = useProgramApis();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAddPrize = useCallback(async (e: any) => {
    e.preventDefault()

    await txHandler(() =>
    addPrize(draffleClient, raffle, draffleClient.provider.wallet.publicKey, new PublicKey(e.target.prizeMint.value), e.target.prizeIndex.value, 1),
    `Prize added successfully!`
    )

    e.target.prizeMint.value = "";
    e.target.prizeIndex.value = "";
    setIsOpen(false);

  },[draffleClient, raffle, setIsOpen])

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
          <form onSubmit={handleAddPrize}>
          <Typography variant="overline">Prize Mint ID</Typography>
          <TextField
            autoFocus
            margin="dense"
            id="prizeMint"
            type="text"
            fullWidth
            variant="standard"
          />
          <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
          <Typography variant="overline">Prize Index (Start at 0)</Typography>
          <TextField
            margin="dense"
            id="prizeIndex"
            type="text"
            fullWidth
            variant="standard"
          />
          <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
          <Button type="submit">Add Prize</Button>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default AddPrizeModal;

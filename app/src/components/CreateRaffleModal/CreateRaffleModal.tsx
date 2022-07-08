import React, { FC, useCallback, useState } from 'react';
import {
  Button,
  IconButton,
  Dialog,
  Typography,
  DialogContent,
  TextField,
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
import { DateTimePicker } from '@material-ui/pickers';

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

  function addDays(date: any, days: any) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

  function addHours(date: any, hours: any) {
    let result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}

  const [selectedDate, handleDateChange] = useState<any>(new Date());

  // Execture function, submit form, clear data
  const handleRaffle = useCallback(
    async (e: any) => {
      e.preventDefault();
      let adjustedEndTimestamp = Math.floor(new Date(selectedDate).getTime()/1000.0);
      let adjustedTicketCost = e.target.ticketCost.value*(1000000000);
      // Use handler to give nice toast message
      await txHandler(
        () =>
          createRaffle(
            draffleClient,
            draffleClient.provider.wallet.publicKey,
            new PublicKey(e.target.tokenMint.value),
            adjustedEndTimestamp,
            adjustedTicketCost,
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
    [draffleClient, selectedDate, setIsOpen]
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
            <Typography variant="overline">Raffle Ticket Price (9 Decimals)</Typography>
            <TextField
              margin="dense"
              id="ticketCost"
              type="text"
              fullWidth
              defaultValue={'10'}
              variant="standard"
            />
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Typography variant="overline">Ticket Supply</Typography>
            <TextField
              margin="dense"
              id="maxEntrants"
              type="text"
              defaultValue={'2000'}
              fullWidth
              variant="standard"
            />
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Typography variant="overline">Raffle End Date</Typography>
            <br></br>
            <DateTimePicker
              id="endTimestamp"
              inputVariant="outlined"
              value={selectedDate}
              onChange={handleDateChange}
            />
            <br></br>
            <Button onClick={() => handleDateChange(addHours(new Date(),3))}>3H</Button>
            <Button onClick={() => handleDateChange(addHours(new Date(),6))}>6H</Button>
            <Button onClick={() => handleDateChange(addDays(new Date(),1))}>1D</Button>
            <Button onClick={() => handleDateChange(addDays(new Date(),2))}>2D</Button>
            <Button onClick={() => handleDateChange(addDays(new Date(),7))}>1W</Button>
            <Spacer height={device === DeviceType.Phone ? '5px' : '10px'} />
            <Button type="submit">Create Raffle</Button>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default CreateRaffleModal;

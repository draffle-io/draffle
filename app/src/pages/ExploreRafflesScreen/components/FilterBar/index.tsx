import { FC } from 'react';
import { Button, Checkbox } from '@material-ui/core';
import SwitchSelector from 'react-switch-selector';
import { useTheme } from '@material-ui/core/styles';
import { useWallet } from '@solana/wallet-adapter-react';

import { useStyles } from './styles';
import { useViewport } from '../../../../hooks/useViewport';
import { DeviceType } from '../../../../providers/ViewportProvider';

interface FilterBarProps {
  hideEndedRaffles: boolean;
  setHideEndedRaffles: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOwnRafflesOnly: React.Dispatch<React.SetStateAction<boolean>>;
}

const FilterBar: FC<FilterBarProps> = ({
  hideEndedRaffles,
  setHideEndedRaffles,
  setShowOwnRafflesOnly,
}) => {
  const { device } = useViewport();
  const classes = useStyles({ device });
  const theme = useTheme();
  const { connected } = useWallet();

  const options = [
    {
      label: 'ALL',
      value: false,
    },
    {
      label: 'MINE',
      value: true,
    },
  ];

  const onOwnRafflesSwitchChange = (newValue: any) => {
    setShowOwnRafflesOnly(newValue);
  };

  if (device === DeviceType.Phone)
    return (
      <div className={classes.filterBar}>
        <div className={classes.leftPhoneSection}>
          {connected && (
            <div className={classes.ownRafflesSwitchContainer}>
              <SwitchSelector
                onChange={onOwnRafflesSwitchChange}
                options={options}
                optionBorderRadius={0}
                wrapperBorderRadius={0}
                fontSize={12}
                initialSelectedIndex={0}
                selectionIndicatorMargin={0}
                selectedBackgroundColor={theme.palette.primary.main}
                backgroundColor={'transparent'}
                fontColor={'white'}
              />
            </div>
          )}
        </div>
        <div className={classes.rightPhoneSection}>
          <div className={classes.showEndedRaffles}>
            <Checkbox
              className={classes.showEndedRafflesCheckbox}
              value={hideEndedRaffles}
              checked={hideEndedRaffles}
              onClick={() =>
                setHideEndedRaffles((currentValue) => !currentValue)
              }
            />
            <Button
              variant="text"
              disableRipple
              className={classes.hideEndedText}
              onClick={() =>
                setHideEndedRaffles((currentValue) => !currentValue)
              }
            >
              Hide ended raffles
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className={classes.filterBar}>
      <div className={classes.leftSection}></div>
      <div className={classes.middleSection}>
        {connected && (
          <div className={classes.ownRafflesSwitchContainer}>
            <SwitchSelector
              onChange={onOwnRafflesSwitchChange}
              options={options}
              optionBorderRadius={0}
              wrapperBorderRadius={0}
              fontSize={12}
              initialSelectedIndex={0}
              selectionIndicatorMargin={0}
              selectedBackgroundColor={theme.palette.primary.main}
              backgroundColor={'transparent'}
              fontColor={'white'}
            />
          </div>
        )}
      </div>
      <div className={classes.rightSection}>
        <div className={classes.showEndedRaffles}>
          <Checkbox
            className={classes.showEndedRafflesCheckbox}
            value={hideEndedRaffles}
            checked={hideEndedRaffles}
            onClick={() => setHideEndedRaffles((currentValue) => !currentValue)}
          />
          <Button
            variant="text"
            disableRipple
            className={classes.hideEndedText}
            onClick={() => setHideEndedRaffles((currentValue) => !currentValue)}
          >
            Hide ended raffles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

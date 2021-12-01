import { FC, useMemo, useRef } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-material-ui';
import { ArrowBack, DoubleArrow } from '@material-ui/icons';
import { Button, IconButton, Typography } from '@material-ui/core';
import { useHistory } from 'react-router';

import { useProgramApis } from '../../hooks/useProgramApis';
import { Raffle } from '../../lib/types';
import Countdown from '../../components/Countdown';
import PrizeShowcaseOngoing from './components/PrizeShowcaseOngoing';
import RaffleInfoSection from '../../components/RaffleInfoSection';
import { PurchaseTickets } from './components/PurchaseTicketsSection/PurchaseTicket';
import { routes } from '../../router/routes';
import Screen from '../../components/layout/Screen';
import useCommonStyles from '../../assets/styles';
import { useStyles } from './styles';
import PrizeGalleryOngoing from './components/PrizeGalleryOngoing';
import { useViewport } from '../../hooks/useViewport';
import { DeviceType } from '../../providers/ViewportProvider';
import Spacer from '../../components/Spacer';

interface IRaffleOngoingScreenProps {
  raffle: Raffle;
  updateRaffle: () => void;
}

const RaffleOngoingScreen: FC<IRaffleOngoingScreenProps> = ({
  raffle,
  updateRaffle,
}) => {
  const { device } = useViewport();
  const classes = { ...useCommonStyles(), ...(useStyles({ device }) as any) };
  const { push } = useHistory();
  const { draffleClient } = useProgramApis();

  const prizeGalleryRef = useRef<HTMLDivElement>(null);

  const entrant = useMemo(() => {
    if (!draffleClient.provider.wallet?.publicKey) return;
    return raffle?.entrants.get(
      draffleClient.provider.wallet.publicKey.toString()
    );
  }, [raffle, draffleClient.provider.wallet?.publicKey]); // "Unnecessary" dependency required due to React not picking up change in publicKey subfield

  if (!raffle) return null;

  return (
    <div className={classes.root}>
      {device === DeviceType.Phone ? (
        <>
          <Typography variant="h1">{`> ${raffle.metadata.name}`}</Typography>
          <div className={classes.countdown}>
            <Countdown endTimestamp={raffle.endTimestamp} spacing={'5%'} />
          </div>
          <RaffleInfoSection
            raffle={raffle}
            userConnected={!!draffleClient.provider.wallet.publicKey}
            userTickets={entrant?.tickets}
          />
          <div className={classes.spacer} />
          <Typography variant="overline">Prizes</Typography>
          <PrizeGalleryOngoing raffle={raffle} scrollRef={prizeGalleryRef} />
          <div className={classes.spacer} />
          {draffleClient.provider.wallet.publicKey ? (
            <PurchaseTickets raffle={raffle} updateRaffle={updateRaffle} />
          ) : (
            <ConnectActionSection />
          )}
          <div className={classes.spacer} />
        </>
      ) : (
        <>
          <div className={classes.topSection}>
            <div className={classes.raffleTitle}>
              <div className={classes.leftTitleSection}>
                <IconButton
                  size="medium"
                  className={classes.backButton}
                  onClick={() => push(routes.RAFFLES)}
                >
                  <ArrowBack />
                </IconButton>
              </div>
              <div className={classes.middleTitleSection}>
                <Typography variant="h1">{`> ${raffle.metadata.name}`}</Typography>
              </div>
              <div className={classes.rightTitleSection}></div>
            </div>
            <div className={classes.countdown}>
              <Countdown endTimestamp={raffle.endTimestamp} spacing={'5%'} />
            </div>
          </div>
          <div className={classes.mainContent}>
            <div className={classes.prizesSection}>
              <Typography variant="overline" className={classes.prizesHeader}>
                Prizes
                {raffle.prizes.length > 3 && (
                  <>
                    {' -'}
                    <Button
                      className={classes.labelPrizeAmount}
                      variant="text"
                      disableRipple
                      onClick={() =>
                        prizeGalleryRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }
                    >
                      <span>See all {raffle.prizes.length}</span>
                    </Button>
                  </>
                )}
              </Typography>
              <PrizeShowcaseOngoing prizes={raffle.prizes} />
            </div>
            <div className={classes.detailsSection}>
              <RaffleInfoSection
                raffle={raffle}
                userConnected={!!draffleClient.provider.wallet.publicKey}
                userTickets={entrant?.tickets}
              />
              <div className={classes.actionSectionContainer}>
                {draffleClient.provider.wallet.publicKey ? (
                  <PurchaseTickets
                    raffle={raffle}
                    updateRaffle={updateRaffle}
                  />
                ) : (
                  <ConnectActionSection />
                )}
              </div>
            </div>
          </div>
          {raffle.prizes.length > 3 && (
            <>
              <DoubleArrow className={classes.scrollIcon} />
              <PrizeGalleryOngoing
                raffle={raffle}
                scrollRef={prizeGalleryRef}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

const ConnectActionSection: FC = () => {
  const { device } = useViewport();
  const classes = { ...useCommonStyles(), ...(useStyles({ device }) as any) };

  return (
    <div className={classes.actionSection}>
      <div className={classes.actionSectionInner}>
        <div className={classes.actionTagline}>
          <Typography variant="h3" className={classes.textHighlight}>
            Tickets are still available.
          </Typography>
          <Typography variant="body1">Don't miss out!</Typography>
        </div>
        <WalletMultiButton
          variant="outlined"
          color="secondary"
          className={`${classes.mainButton} ${classes.connectToBuyButton}`}
        >
          Connect to buy
        </WalletMultiButton>
      </div>
    </div>
  );
};

interface IRaffleOngoingDetailsProps {
  raffle: Raffle;
  updateRaffle: () => void;
}

const RaffleOngoingScreenWithLayout: FC<IRaffleOngoingDetailsProps> = (
  props
) => {
  const { push } = useHistory();

  return (
    <Screen onBackNavigation={() => push(routes.RAFFLES)}>
      <RaffleOngoingScreen {...props} />
    </Screen>
  );
};

export default RaffleOngoingScreenWithLayout;

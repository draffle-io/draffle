import { FC, useCallback, useMemo, useRef } from 'react';
import { Button, IconButton, Tooltip, Typography } from '@material-ui/core';
import { sleep } from '@project-serum/common';
import toast from 'react-hot-toast';
import { useHistory } from 'react-router';
import { ArrowBack, DoubleArrow } from '@material-ui/icons';

import { useProgramApis } from '../../hooks/useProgramApis';
import { claimPrize as claimPrizeQuery } from '../../lib/actions/claimPrize';
import { Raffle } from '../../lib/types';
import { routes } from '../../router/routes';
import Screen from '../../components/layout/Screen';
import { expand } from '../../lib/randomnessTools';
import EndedRaffleActionSection from './components/EndedRaffleActionsSection';
import RaffleInfoSection from '../../components/RaffleInfoSection';
import PrizeGalleryEnded from './components/PrizeGalleryEnded';
import { PrizeShowcaseEnded } from './components/PrizeShowcaseEnded';
import useCommonStyles from '../../assets/styles';
import { useStyles } from './styles';
import { useViewport } from '../../hooks/useViewport';
import { DeviceType } from '../../providers/ViewportProvider';

interface IRaffleEndedScreenProps {
  raffle: Raffle;
  updateRaffle: () => void;
}

const RaffleEndedScreen: FC<IRaffleEndedScreenProps> = ({
  raffle,
  updateRaffle,
}) => {
  const { device } = useViewport();
  const classes = { ...useCommonStyles(), ...(useStyles({ device }) as any) };
  const { push } = useHistory();
  const { draffleClient } = useProgramApis();

  const prizeGalleryRef = useRef<HTMLDivElement>(null);

  const entrant = useMemo(() => {
    if (!draffleClient.provider.wallet.publicKey) return;

    return raffle?.entrants.get(
      draffleClient.provider.wallet.publicKey.toString()
    );
  }, [raffle, draffleClient.provider.wallet.publicKey]); // "Unnecessary" dependency required due to React not picking up change in publicKey subfield

  // Each winning ticket index for each prize
  const winningTickets = useMemo(() => {
    if (!raffle.randomness || !raffle.entrants || raffle.entrants.size === 0)
      return [];
    const secret = raffle.randomness;
    return raffle.prizes.map((_, prizeIndex) => {
      const rand = expand(secret, prizeIndex);
      return rand % raffle.totalTickets;
    });
  }, [raffle]);

  const claimPrize = useCallback(
    async (prizeIndex: number, ticketIndex: number) => {
      try {
        await claimPrizeQuery(draffleClient, raffle, prizeIndex, ticketIndex);
        await sleep(500);
        updateRaffle();
        toast.success('Prize claimed, check your wallet!');
      } catch (error: any) {
        if (error.msg) {
          toast.error(`Transaction failed: ${error.msg}`);
        } else {
          toast.error('Unexpected error');
        }
      }
    },
    [draffleClient, raffle, updateRaffle]
  );

  const entrantWinningTickets = useMemo(() => {
    if (!entrant || !winningTickets) return [];
    return winningTickets.reduce<{ prizeIndex: number; ticketIndex: number }[]>(
      (acc, ticketIndex, prizeIndex) => {
        if (entrant?.tickets.includes(ticketIndex)) {
          return [...acc, { prizeIndex, ticketIndex }];
        } else {
          return acc;
        }
      },
      []
    );
  }, [entrant, winningTickets]);

  if (!raffle) return null;

  return (
    <div className={classes.root}>
      {device === DeviceType.Phone ? (
        <>
          <Typography variant="h1">
            {`> ${raffle.metadata.name}`}
            <span className={classes.raffleSubtitle}>[ended]</span>
          </Typography>
          <div className={classes.spacer} />
          <RaffleInfoSection
            raffle={raffle}
            userConnected={!!draffleClient.provider.wallet.publicKey}
            userTickets={entrant?.tickets}
          />
          <div className={classes.spacer} />
          <div className={classes.actionSectionContainer}>
            <div className={classes.actionSection}>
              <EndedRaffleActionSection
                raffle={raffle}
                userPubkey={draffleClient.provider.wallet.publicKey}
                entrant={entrant}
                entrantWinningTickets={entrantWinningTickets}
                scrollRef={prizeGalleryRef}
              />
            </div>
          </div>
          <div className={classes.spacer} />
          <Typography variant="overline">Results</Typography>
          <PrizeGalleryEnded
            raffle={raffle}
            entrantWinningTickets={entrantWinningTickets}
            winningTickets={winningTickets}
            claimPrize={claimPrize}
            scrollRef={prizeGalleryRef}
          />
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
                  <ArrowBack className={classes.backButtonIcon} />
                </IconButton>
              </div>
              <div className={classes.middleTitleSection}>
                <Typography variant="h1">{`> ${raffle.metadata.name}`}</Typography>
                <Tooltip
                  title={raffle.endTimestamp.toString()}
                  placement="bottom"
                >
                  <Typography variant="h1" className={classes.raffleSubtitle}>
                    [ended]
                  </Typography>
                </Tooltip>
              </div>
              <div className={classes.rightTitleSection}></div>
            </div>
          </div>
          <div className={classes.mainContent}>
            <div className={classes.prizesSection}>
              <Typography variant="overline">
                Prizes
                {raffle.prizes.length > 3 && (
                  <>
                    {' -'}
                    <Button
                      variant="text"
                      disableRipple
                      className={classes.seeAllPrizesButton}
                      onClick={() =>
                        prizeGalleryRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }
                    >
                      See all {raffle.prizes.length}
                    </Button>
                  </>
                )}
              </Typography>
              <PrizeShowcaseEnded
                raffle={raffle}
                winningTickets={winningTickets}
              />
            </div>
            <div className={classes.detailsSection}>
              <RaffleInfoSection
                raffle={raffle}
                userConnected={!!draffleClient.provider.wallet.publicKey}
                userTickets={entrant?.tickets}
              />
              <div className={classes.actionSectionContainer}>
                <div className={classes.actionSection}>
                  <EndedRaffleActionSection
                    raffle={raffle}
                    userPubkey={draffleClient.provider.wallet.publicKey}
                    entrant={entrant}
                    entrantWinningTickets={entrantWinningTickets}
                    scrollRef={prizeGalleryRef}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={classes.prizeGallerySection}>
            <DoubleArrow className={classes.scrollIcon} />
            <PrizeGalleryEnded
              raffle={raffle}
              entrantWinningTickets={entrantWinningTickets}
              winningTickets={winningTickets}
              claimPrize={claimPrize}
              scrollRef={prizeGalleryRef}
            />
          </div>
        </>
      )}
      <div className={classes.spacer} />
    </div>
  );
};

interface IRaffleEndedDetailsProps {
  raffle: Raffle;
  updateRaffle: () => void;
}

const RaffleEndedScreenWithLayout: FC<IRaffleEndedDetailsProps> = (props) => {
  const { push } = useHistory();

  return (
    <Screen onBackNavigation={() => push(routes.RAFFLES)}>
      <RaffleEndedScreen {...props} />
    </Screen>
  );
};

export default RaffleEndedScreenWithLayout;

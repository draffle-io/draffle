import { useEffect, useState } from 'react';

interface useRandomDrawerArgs {
  endRange: number;
  drawLength?: number;
  spinIntervalMs?: number;
  redrawIntervalMs?: number;
}

const useRandomDrawer = ({
  endRange,
  drawLength = 50,
  spinIntervalMs = 100,
  redrawIntervalMs = 5000,
}: useRandomDrawerArgs): number | undefined => {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [randomTickets, setRandomTickets] = useState<number[]>([]);

  useEffect(() => {
    const timerId = setInterval(
      () =>
        setRandomTickets(
          Array.from({ length: drawLength }, () =>
            Math.round(Math.random() * endRange)
          )
        ),
      redrawIntervalMs
    );
    return () => clearInterval(timerId);
  }, [endRange, redrawIntervalMs, drawLength, setRandomTickets]);

  useEffect(() => {
    const timerId = setInterval(
      () =>
        setCurrentTicketIndex(
          (prevTicketIndex) => ++prevTicketIndex % drawLength
        ),
      spinIntervalMs
    );
    return () => clearInterval(timerId);
  }, [drawLength, spinIntervalMs, setCurrentTicketIndex]);

  if (endRange === 0) return undefined;
  return randomTickets[currentTicketIndex];
};

export default useRandomDrawer;

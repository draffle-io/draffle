import React, { FC, useEffect, useMemo, useState } from 'react';
import CountUp from 'react-countup';

import { getRemainingTime } from '../../lib/utils';
import { useStyles } from './styles';

export interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  endTimestamp: Date;
  spacing?: string;
}

export const Countdown: FC<CountdownProps> = ({
  endTimestamp,
  spacing = '0px',
  className,
  ...otherProps
}) => {
  const classes = useStyles();
  const [now, setNow] = useState(new Date());
  const [animationEnded, setAnimationEnded] = useState(false);
  const { days, hours, minutes, seconds } = useMemo(
    () => getRemainingTime(now, endTimestamp),
    [now, endTimestamp]
  );

  useEffect(() => {
    setNow(new Date());
    const timerId = setInterval(
      (startDate: number) => {
        if (new Date().getTime() * 1000 - startDate > 0.2) setNow(new Date());
      },
      1000,
      new Date().getTime() * 1000
    );
    return () => clearInterval(timerId);
  }, [setNow]);

  return !animationEnded ? (
    <div className={`${classes.root} ${className}`} {...otherProps}>
      <div style={{ marginRight: spacing }}>
        <CountUp
          start={0}
          end={days}
          delay={0}
          duration={0.8}
          preserveValue
          useEasing
          onEnd={() => setAnimationEnded(true)}
        >
          {({ countUpRef: daysRef }) => <span ref={daysRef} />}
        </CountUp>
      </div>
      :
      <div style={{ marginRight: spacing, marginLeft: spacing }}>
        <CountUp
          start={0}
          end={hours}
          delay={0}
          duration={0.8}
          preserveValue
          useEasing
          onEnd={() => setAnimationEnded(true)}
          formattingFn={(number) =>
            number.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })
          }
        >
          {({ countUpRef: hoursRef }) => <span ref={hoursRef} />}
        </CountUp>
      </div>
      :
      <div style={{ marginRight: spacing, marginLeft: spacing }}>
        <CountUp
          start={0}
          end={minutes}
          delay={0}
          duration={0.8}
          preserveValue
          useEasing
          onEnd={() => setAnimationEnded(true)}
          formattingFn={(number) =>
            number.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })
          }
        >
          {({ countUpRef: minutesRef }) => <span ref={minutesRef} />}
        </CountUp>
      </div>
      :
      <div style={{ marginLeft: spacing }}>
        <CountUp
          start={0}
          end={seconds}
          delay={0}
          duration={0.8}
          preserveValue
          useEasing
          onEnd={() => setAnimationEnded(true)}
          formattingFn={(number) =>
            number.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })
          }
        >
          {({ countUpRef: secondsRef }) => <span ref={secondsRef} />}
        </CountUp>
      </div>
    </div>
  ) : (
    <div className={`${classes.root} ${className}`} {...otherProps}>
      <span style={{ marginRight: spacing }}>{days}</span>:
      <span style={{ marginRight: spacing, marginLeft: spacing }}>
        {hours.toLocaleString('en-US', {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
      </span>
      :
      <span style={{ marginRight: spacing, marginLeft: spacing }}>
        {minutes.toLocaleString('en-US', {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
      </span>
      :
      <span style={{ marginLeft: spacing }}>
        {seconds.toLocaleString('en-US', {
          minimumIntegerDigits: 2,
          useGrouping: false,
        })}
      </span>
    </div>
  );
};

export default Countdown;

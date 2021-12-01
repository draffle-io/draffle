import React, { FC, useEffect, useState } from 'react';
import { IconButton, Slide } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';

import { useStyles } from './styles';
import { useViewport } from '../../hooks/useViewport';

const ScrollToTop: FC = () => {
  const { device } = useViewport();
  const classes = useStyles({ device });

  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className={classes.root}>
      <Slide direction="up" in={isVisible}>
        <IconButton
          size={'medium'}
          className={classes.scrollButton}
          onClick={scrollToTop}
        >
          <ChevronRight className={classes.scrollButtonIcon} />
        </IconButton>
      </Slide>
    </div>
  );
};

export default ScrollToTop;

import React, { FC } from 'react';
import { Tooltip } from '@material-ui/core';

export interface ShortenedStringProps {
  message: string;
  maxCharLength: number;
  addTooltip?: boolean;
}

const ShortenedString: FC<ShortenedStringProps> = ({
  message,
  maxCharLength,
  addTooltip = false,
}) => {
  if (message.length <= maxCharLength) return <>{message}</>;

  if (addTooltip)
    return (
      <Tooltip title={message} placement="top">
        <>{message.slice(0, maxCharLength - 4)} ...</>
      </Tooltip>
    );

  return <>{message.slice(0, maxCharLength - 4)} ...</>;
};

export default ShortenedString;

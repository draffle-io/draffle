import React, { FC } from 'react';

export interface SpacerProps {
  height: string;
}

const Spacer: FC<SpacerProps> = ({ height }) => (
  <div style={{ height, width: '100%' }} />
);

export default Spacer;

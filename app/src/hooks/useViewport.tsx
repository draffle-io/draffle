import { useContext } from 'react';
import { ViewportContext } from '../providers/ViewportProvider';

export const useViewport = () => {
  const context = useContext(ViewportContext);
  if (context === undefined) {
    throw new Error('useViewport must be used within an ViewportContext');
  }
  return context;
};

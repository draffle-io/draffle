import { useContext } from 'react';
import { ProgramApisContext } from '../providers/ProgramApisProvider';

export const useProgramApis = () => {
  const context = useContext(ProgramApisContext);
  if (context === undefined) {
    throw new Error('useProgramApis must be used within a ProgramApisProvider');
  }
  return context;
};

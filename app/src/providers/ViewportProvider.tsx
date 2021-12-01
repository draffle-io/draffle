import React, { FC } from 'react';

export enum DeviceType {
  Phone = 0,
  Tablet = 1,
  Desktop = 2,
}

const PHONE_BREAKPOINT = 600;
const TABLET_BREAKPOINT = 768;

export interface ViewportInfo {
  device: DeviceType;
}

// @ts-ignore
export const ViewportContext = React.createContext<ViewportInfo>();

const ViewportProvider: FC = ({ children }) => {
  const [device, setDevice] = React.useState(DeviceType.Desktop);

  React.useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerWidth < PHONE_BREAKPOINT && device !== DeviceType.Phone)
        setDevice(DeviceType.Phone);
      else if (
        window.innerWidth < TABLET_BREAKPOINT &&
        device !== DeviceType.Tablet
      )
        setDevice(DeviceType.Tablet);
      else if (
        window.innerWidth >= TABLET_BREAKPOINT &&
        device !== DeviceType.Desktop
      )
        setDevice(DeviceType.Desktop);
    };
    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  return (
    <ViewportContext.Provider value={{ device }}>
      {children}
    </ViewportContext.Provider>
  );
};

export default ViewportProvider;

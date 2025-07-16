import React, { createContext, useContext, useState } from 'react';

interface TimerContextType {
  isTimerActive: boolean;
  setIsTimerActive: (active: boolean) => void;
}

const TimerContext = createContext<TimerContextType>({
  isTimerActive: false,
  setIsTimerActive: () => {},
});

export const useTimer = () => useContext(TimerContext);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  return (
    <TimerContext.Provider value={{ isTimerActive, setIsTimerActive }}>
      {children}
    </TimerContext.Provider>
  );
}; 
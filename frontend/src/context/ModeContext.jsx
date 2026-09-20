import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ModeContext = createContext(null);

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState('LIVE');
  const [isQuickAttackOpen, setIsQuickAttackOpen] = useState(false);

  useEffect(() => {
    api.getSystemMode()
      .then(res => setModeState(res.mode))
      .catch(() => setModeState('LIVE'));
  }, []);

  const switchMode = async (newMode) => {
    try {
      const res = await api.setSystemMode(newMode);
      setModeState(res.mode);
      return res;
    } catch (err) {
      console.error("Failed to switch mode:", err);
      setModeState(newMode);
    }
  };

  return (
    <ModeContext.Provider value={{
      mode,
      switchMode,
      isQuickAttackOpen,
      setIsQuickAttackOpen
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PosSessionListDto } from '@/types/pos.types';

const STORAGE_KEY = 'pos_current_session';

type POSSessionContextValue = {
  currentSession: PosSessionListDto | null;
  setCurrentSession: (session: PosSessionListDto | null) => void;
};

const POSSessionContext = createContext<POSSessionContextValue | undefined>(undefined);

function readStoredSession(): PosSessionListDto | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PosSessionListDto;
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: PosSessionListDto | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const POSSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setState] = useState<PosSessionListDto | null>(readStoredSession);

  const setCurrentSession = useCallback((session: PosSessionListDto | null) => {
    setState(session);
    writeStoredSession(session);
  }, []);

  useEffect(() => {
    const stored = readStoredSession();
    setState(stored);
  }, []);

  const value: POSSessionContextValue = { currentSession, setCurrentSession };
  return <POSSessionContext.Provider value={value}>{children}</POSSessionContext.Provider>;
};

export function usePOSSession(): POSSessionContextValue {
  const context = useContext(POSSessionContext);
  if (context === undefined) {
    throw new Error('usePOSSession must be used within a POSSessionProvider');
  }
  return context;
}

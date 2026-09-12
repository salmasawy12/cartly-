import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const IS_PRO_KEY = 'is_pro';

export const FREE_LIST_LIMIT = 1;

type ProContextValue = {
  isPro: boolean;
  loading: boolean;
  // Stubbed purchase flow - no real payment processor wired up yet.
  // Flips the local flag so the paywall gates can be tested end-to-end.
  simulatePurchase: () => Promise<void>;
  resetToFree: () => Promise<void>;
};

const ProContext = createContext<ProContextValue | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(IS_PRO_KEY)
      .then(value => setIsPro(value === 'true'))
      .finally(() => setLoading(false));
  }, []);

  async function simulatePurchase() {
    await AsyncStorage.setItem(IS_PRO_KEY, 'true');
    setIsPro(true);
  }

  async function resetToFree() {
    await AsyncStorage.removeItem(IS_PRO_KEY);
    setIsPro(false);
  }

  return (
    <ProContext.Provider value={{ isPro, loading, simulatePurchase, resetToFree }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within a ProProvider');
  return ctx;
}

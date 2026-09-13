import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  deepLinkToSubscriptions,
  finishTransaction,
  useIAP,
  type ProductSubscription,
  type Purchase,
} from 'react-native-iap';
import { PRO_SUBSCRIPTION_ID } from '../config/iap';

// Cached only so the paywall state doesn't flash "Free" for a moment on every
// launch while we wait on the real StoreKit/Play Billing check below.
const IS_PRO_CACHE_KEY = 'is_pro_cache';

export const FREE_LIST_LIMIT = 1;

type ProContextValue = {
  isPro: boolean;
  loading: boolean;
  product: ProductSubscription | null;
  purchasing: boolean;
  restoring: boolean;
  iapError: string | null;
  clearIapError: () => void;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  manageSubscription: () => Promise<void>;
};

const ProContext = createContext<ProContextValue | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    restorePurchases: restorePurchasesIAP,
    hasActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      await finishTransaction({ purchase, isConsumable: false });
      await refreshEntitlement();
      setPurchasing(false);
    },
    onPurchaseError: error => {
      setPurchasing(false);
      if (error.code === 'user-cancelled') return;
      setIapError(error.message || 'Purchase failed. Please try again.');
    },
  });

  useEffect(() => {
    AsyncStorage.getItem(IS_PRO_CACHE_KEY).then(value => {
      if (value === 'true') setIsPro(true);
    });
  }, []);

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [PRO_SUBSCRIPTION_ID], type: 'subs' }).catch(() => {
      // Non-fatal - the paywall falls back to static copy if the product didn't load.
    });
    refreshEntitlement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  async function refreshEntitlement() {
    try {
      const active = await hasActiveSubscriptions([PRO_SUBSCRIPTION_ID]);
      setIsPro(active);
      await AsyncStorage.setItem(IS_PRO_CACHE_KEY, active ? 'true' : 'false');
    } catch {
      // Keep whatever we had cached - a failed entitlement check shouldn't lock out a real subscriber.
    } finally {
      setLoading(false);
    }
  }

  async function purchasePro() {
    if (!connected) {
      setIapError('Store connection unavailable. Please try again in a moment.');
      return;
    }
    setIapError(null);
    setPurchasing(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: PRO_SUBSCRIPTION_ID },
          google: { skus: [PRO_SUBSCRIPTION_ID] },
        },
        type: 'subs',
      });
    } catch (err: any) {
      setPurchasing(false);
      setIapError(err?.message || 'Purchase failed. Please try again.');
    }
  }

  async function restorePurchases() {
    setIapError(null);
    setRestoring(true);
    try {
      await restorePurchasesIAP();
      await refreshEntitlement();
    } catch (err: any) {
      setIapError(err?.message || 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  }

  async function manageSubscription() {
    try {
      await deepLinkToSubscriptions();
    } catch (err: any) {
      setIapError(err?.message || 'Could not open subscription settings.');
    }
  }

  const product = subscriptions.find(s => s.id === PRO_SUBSCRIPTION_ID) ?? null;

  return (
    <ProContext.Provider
      value={{
        isPro,
        loading,
        product,
        purchasing,
        restoring,
        iapError,
        clearIapError: () => setIapError(null),
        purchasePro,
        restorePurchases,
        manageSubscription,
      }}
    >
      {children}
    </ProContext.Provider>
  );
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within a ProProvider');
  return ctx;
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { Chain, ConfigResponseDto } from '@mintit/types';

interface ChainContextValue {
  chain: Chain;
  setChain: (c: Chain) => void;
  enabledChains: Chain[];
}

const ChainContext = createContext<ChainContextValue>({
  chain: Chain.Firo,
  setChain: () => {},
  enabledChains: [],
});

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [chain, setChain] = useState<Chain>(Chain.Firo);
  const [enabledChains, setEnabledChains] = useState<Chain[]>([]);

  useEffect(() => {
    api
      .get<ConfigResponseDto>('/config')
      .then(({ data }) => {
        setEnabledChains(data.enabledChains);
        if (
          data.enabledChains.length > 0 &&
          !data.enabledChains.includes(chain)
        ) {
          setChain(data.enabledChains[0]);
        }
      })
      .catch(() => {
        // fallback — leave defaults in place
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChainContext.Provider value={{ chain, setChain, enabledChains }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  return useContext(ChainContext);
}

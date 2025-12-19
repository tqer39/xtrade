'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

const swrConfig = {
  dedupingInterval: 300000, // 5分
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryCount: 2,
};

export function Providers({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}

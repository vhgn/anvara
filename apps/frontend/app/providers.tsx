'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, Suspense } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <Suspense>{props.children}</Suspense>
    </QueryClientProvider>
  );
}

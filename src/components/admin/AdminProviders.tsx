"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const ADMIN_QUERY_CACHE_KEY = "dgm-admin-query-cache";

function createAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

function createSessionPersister() {
  if (typeof window === "undefined") {
    return createSyncStoragePersister({
      storage: undefined,
      key: ADMIN_QUERY_CACHE_KEY,
    });
  }

  return createSyncStoragePersister({
    storage: window.sessionStorage,
    key: ADMIN_QUERY_CACHE_KEY,
  });
}

export default function AdminProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAdminQueryClient);
  const [persister] = useState(createSessionPersister);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 30 * 60_000,
        buster: "admin-v4",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) && query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

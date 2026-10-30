"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StoreCms } from "@/lib/store-cms";
import { defaultStoreCms, sanitizeStoreCms } from "@/lib/store-cms";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";

type StoreCmsResponse = { cms: StoreCms };

function normalizeCms(cms?: StoreCms | null): StoreCms {
  try {
    return sanitizeStoreCms(cms || defaultStoreCms());
  } catch {
    return defaultStoreCms();
  }
}

export function useStoreCmsQuery() {
  return useQuery({
    queryKey: adminKeys.storeCms(),
    queryFn: async () => {
      const payload = await adminFetch<StoreCmsResponse>("/api/admin/store");
      return normalizeCms(payload.cms);
    },
  });
}

export function useSaveStoreCms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cms: StoreCms) => {
      const payload = await adminFetch<StoreCmsResponse>("/api/admin/store", {
        method: "PUT",
        body: JSON.stringify({ cms }),
      });
      return normalizeCms(payload.cms);
    },
    onSuccess: (cms) => {
      queryClient.setQueryData(adminKeys.storeCms(), cms);
    },
  });
}

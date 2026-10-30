"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";

type AuthMeResponse = {
  user?: {
    id?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
  };
};

export function useAdminMeQuery() {
  return useQuery({
    queryKey: adminKeys.me(),
    queryFn: () => adminFetch<AuthMeResponse>("/api/auth/me"),
    staleTime: 5 * 60_000,
  });
}

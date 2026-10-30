"use client";

import { useEffect } from "react";
import { useAdminFetching } from "@/components/admin/AdminPageContext";

/** Reflects React Query fetching into the persistent shell header chip. */
export function useSyncAdminFetching(isFetching: boolean) {
  const { setIsFetching } = useAdminFetching();

  useEffect(() => {
    setIsFetching(isFetching);
    return () => setIsFetching(false);
  }, [isFetching, setIsFetching]);
}

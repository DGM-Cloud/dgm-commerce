"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AdminPageMeta {
  title: string;
  subtitle: string;
}

interface AdminPageContextValue {
  meta: AdminPageMeta;
  setMeta: (meta: AdminPageMeta) => void;
  isFetching: boolean;
  setIsFetching: (value: boolean) => void;
}

const DEFAULT_META: AdminPageMeta = {
  title: "Panel",
  subtitle: "Administración de la tienda",
};

const AdminPageContext = createContext<AdminPageContextValue | null>(null);

export function AdminPageProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<AdminPageMeta>(DEFAULT_META);
  const [isFetching, setIsFetching] = useState(false);

  const setMeta = useCallback((next: AdminPageMeta) => {
    setMetaState(next);
  }, []);

  const value = useMemo(
    () => ({ meta, setMeta, isFetching, setIsFetching }),
    [meta, setMeta, isFetching],
  );

  return <AdminPageContext.Provider value={value}>{children}</AdminPageContext.Provider>;
}

function useAdminPageContext() {
  const context = useContext(AdminPageContext);
  if (!context) {
    throw new Error("useAdminPage must be used within AdminPageProvider");
  }
  return context;
}

/** Sets the persistent shell header for the current route. */
export function useAdminPage({ title, subtitle }: AdminPageMeta) {
  const { setMeta } = useAdminPageContext();

  useEffect(() => {
    setMeta({ title, subtitle });
  }, [title, subtitle, setMeta]);
}

export function useAdminPageMeta() {
  return useAdminPageContext().meta;
}

export function useAdminFetching() {
  const { isFetching, setIsFetching } = useAdminPageContext();
  return { isFetching, setIsFetching };
}

/** Client bridge for server-component pages that only need title/subtitle. */
export function AdminPageMeta({ title, subtitle }: AdminPageMeta) {
  useAdminPage({ title, subtitle });
  return null;
}

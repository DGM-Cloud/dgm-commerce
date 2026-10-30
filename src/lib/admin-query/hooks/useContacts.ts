"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminContact } from "@/lib/admin-data";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";

export type ContactsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  client?: string[];
  document?: string[];
  number?: string[];
  contactedBy?: string[];
};

export type ContactsFacets = {
  clients: string[];
  documents: string[];
  numbers: string[];
  contactedBy: string[];
};

export type ContactsListResponse = {
  contacts: AdminContact[];
  total?: number;
  page?: number;
  pageSize?: number;
  facets?: ContactsFacets;
};

function buildContactsUrl(params?: ContactsListParams) {
  if (!params) return "/api/admin/contacts";
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  if (params.client?.length) search.set("client", params.client.join(","));
  if (params.document?.length) search.set("document", params.document.join(","));
  if (params.number?.length) search.set("number", params.number.join(","));
  if (params.contactedBy?.length) search.set("contactedBy", params.contactedBy.join(","));
  const qs = search.toString();
  return qs ? `/api/admin/contacts?${qs}` : "/api/admin/contacts";
}

function toKey(params?: ContactsListParams) {
  if (!params) return undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q,
    client: params.client?.join(",") || undefined,
    document: params.document?.join(",") || undefined,
    number: params.number?.join(",") || undefined,
    contactedBy: params.contactedBy?.join(",") || undefined,
  };
}

export function useContactsQuery(params?: ContactsListParams) {
  return useQuery({
    queryKey: adminKeys.contacts(toKey(params)),
    queryFn: () => adminFetch<ContactsListResponse>(buildContactsUrl(params)),
  });
}

export function useInvalidateContacts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [...adminKeys.all, "contacts"] });
}

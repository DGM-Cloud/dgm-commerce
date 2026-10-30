"use client";

import React from "react";
import type { AdminContact } from "@/lib/admin-data";

interface Props {
  contacts: AdminContact[];
  selectedIds: string[];
  onRowClick: (id: string, event: React.MouseEvent<HTMLElement>) => void;
}

export default function ContactsTable({ contacts, selectedIds, onRowClick }: Props) {
  return (
    <div className="mt-4 overflow-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-100 text-left text-xs uppercase text-zinc-600">
            <th className="px-3 py-2">CLIENTE</th>
            <th className="px-3 py-2">DOCUMENTO</th>
            <th className="px-3 py-2">NUMERO</th>
            <th className="px-3 py-2">CONTACTADO POR</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr
              key={c.id}
              onClick={(e) => onRowClick(c.id, e)}
              className={[
                "cursor-pointer border-b transition",
                selectedIds.includes(c.id) ? "bg-amber-50" : "bg-white",
              ].join(" ")}
            >
              <td className="px-3 py-3 align-top">
                <div className="font-bold">{c.client}</div>
              </td>
              <td className="px-3 py-3 align-top">
                <div className="font-semibold">{c.documentType}</div>
                <div className="mt-1 text-zinc-700">{c.document}</div>
              </td>
              <td className="px-3 py-3 align-top">
                <div className="text-zinc-700">{c.cellphone}</div>
              </td>
              <td className="px-3 py-3 align-top">
                <div className="text-zinc-700">{Array.isArray(c.contactedBy) ? c.contactedBy.join(", ") : String(c.contactedBy)}{c.contactedByOther ? ` (${c.contactedByOther})` : ""}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { NextResponse } from "next/server";
import { createContact, listContacts } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminContact } from "@/lib/admin-data";
import { paginateItems, parseAdminListQuery } from "@/lib/admin-query/list-params";

function parseCsvParam(url: string, key: string) {
  const value = new URL(url).searchParams.get(key);
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const query = parseAdminListQuery(request.url);
  const clients = parseCsvParam(request.url, "client");
  const documents = parseCsvParam(request.url, "document");
  const numbers = parseCsvParam(request.url, "number");
  const contactedBy = parseCsvParam(request.url, "contactedBy");

  const contacts = await listContacts();
  const facets = {
    clients: Array.from(new Set(contacts.map((contact) => contact.client).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    documents: Array.from(new Set(contacts.map((contact) => contact.document).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    numbers: Array.from(new Set(contacts.map((contact) => contact.cellphone).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    contactedBy: Array.from(
      new Set(
        contacts.flatMap((contact) => {
          const values = Array.isArray(contact.contactedBy) ? contact.contactedBy : [];
          return contact.contactedByOther ? [...values, contact.contactedByOther] : values;
        }).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es")),
  };

  const filtered = contacts.filter((contact) => {
    const contactText = Array.isArray(contact.contactedBy) ? contact.contactedBy.join(" ") : String(contact.contactedBy || "");
    const matchesSearch =
      !query.q ||
      [
        contact.id,
        contact.documentType,
        contact.document,
        contact.lastNamePaterno,
        contact.lastNameMaterno,
        contact.names,
        contact.client,
        contact.cellphone,
        contact.email,
        contact.district,
        contact.agency,
        contactText,
        contact.contactedByOther,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.q);

    const matchesClient = clients.length === 0 || clients.includes(contact.client);
    const matchesDocument = documents.length === 0 || documents.includes(contact.document);
    const matchesNumber = numbers.length === 0 || numbers.includes(contact.cellphone);
    const matchesContactedBy =
      contactedBy.length === 0 ||
      contactedBy.some(
        (filter) => contact.contactedBy.includes(filter) || contact.contactedByOther?.toUpperCase() === filter,
      );

    return matchesSearch && matchesClient && matchesDocument && matchesNumber && matchesContactedBy;
  });

  // No pageSize → full list (SaleModal). Explicit pageSize → server page.
  const paged = paginateItems(filtered, query.page, query.pageSize);

  return NextResponse.json({
    contacts: paged.items,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    facets,
  });
}

export async function POST(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const body = await readJsonBody<Omit<AdminContact, "id">>(request);
  if (
    !body.documentType ||
    !body.document ||
    !body.lastNamePaterno ||
    !body.lastNameMaterno ||
    !body.names ||
    !body.sex ||
    !body.birthDate ||
    !body.numero ||
    !body.client ||
    !body.cellphone ||
    !body.email ||
    !body.province ||
    !body.district ||
    !body.department ||
    !body.address ||
    !body.addressNumber ||
    !body.reference ||
    !body.agency ||
    !body.contactedBy ||
    !Array.isArray(body.contactedBy) ||
    (body.contactedBy.includes("OTROS") && !body.contactedByOther) ||
    !body.classification
  ) {
    const required = [
      "documentType",
      "document",
      "lastNamePaterno",
      "lastNameMaterno",
      "names",
      "sex",
      "birthDate",
      "numero",
      "client",
      "cellphone",
      "email",
      "province",
      "district",
      "department",
      "address",
      "addressNumber",
      "reference",
      "agency",
      "contactedBy",
      "classification",
    ];

    const missing = required.filter((key) => {
      // @ts-ignore
      return !body[key] && body[key] !== 0;
    });

    return NextResponse.json({ error: "Invalid payload.", missing }, { status: 400 });
  }

  const contact = await createContact({
    documentType: body.documentType,
    document: body.document,
    lastNamePaterno: body.lastNamePaterno,
    lastNameMaterno: body.lastNameMaterno,
    names: body.names,
    sex: body.sex,
    birthDate: body.birthDate,
    numero: body.numero,
    classification: body.classification,
    client: body.client,
    cellphone: body.cellphone,
    email: body.email,
    province: body.province,
    district: body.district,
    department: body.department,
    address: body.address,
    addressNumber: body.addressNumber,
    reference: body.reference,
    agency: body.agency,
    contactedBy: body.contactedBy,
    contactedByOther: body.contactedByOther || undefined,
  });

  return NextResponse.json({ contact }, { status: 201 });
}

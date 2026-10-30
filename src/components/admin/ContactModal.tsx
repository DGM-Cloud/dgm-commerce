"use client";

import { FormEvent, memo, useLayoutEffect, useMemo, useState } from "react";
import CrudModal from "@/components/admin/CrudModal";
import type { AdminContact } from "@/lib/admin-data";
import {
  departmentOptions,
  findDepartmentOptionByName,
  findDistrictOptionByName,
  findProvinceOptionByName,
  getDistrictOptions,
  getProvinceOptions,
} from "@/lib/peru-ubigeo";
import { TRANSPORT_AGENCY_OPTIONS } from "@/data/agencias-peru";

type ContactForm = Omit<AdminContact, "id" | "client">;

type UbigeoSelection = {
  departmentCode: string;
  provinceCode: string;
  districtCode: string;
};

const CONTACT_SOURCE_OPTIONS = [
  "FACEBOOK",
  "INSTAGRAM",
  "WEB",
  "CORREO",
  "RECOMENDADO",
  "OTROS",
] as const;

/* Transport agency options moved to src/data/agencias-peru.ts */

const initialForm: ContactForm = {
  documentType: "DNI",
  document: "",
  lastNamePaterno: "",
  lastNameMaterno: "",
  names: "",
  sex: "MASCULINO",
  birthDate: "",
  classification: "MINORISTA",
  numero: "",
  cellphone: "",
  email: "",
  province: "",
  district: "",
  department: "",
  address: "",
  addressNumber: "",
  reference: "",
  agency: "",
  contactedBy: [],
  contactedByOther: "",
};

const initialUbigeoSelection: UbigeoSelection = {
  departmentCode: "14",
  provinceCode: "01",
  districtCode: "01",
};

function buildClientName(form: ContactForm) {
  return [form.lastNamePaterno, form.lastNameMaterno, form.names]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function validateContactForm(form: ContactForm) {
  const clientName = buildClientName(form);
  const documentDigits = form.document.trim().replace(/\D/g, "");
  const today = new Date().toISOString().slice(0, 10);

  if (form.documentType === "DNI" && documentDigits.length !== 8) {
    return "El DNI debe tener 8 dígitos.";
  }

  if (form.documentType === "RUC" && documentDigits.length !== 11) {
    return "El RUC debe tener 11 dígitos.";
  }

  if (!form.birthDate || form.birthDate > today) {
    return "Debe ingresar una fecha de nacimiento válida.";
  }

  if (!clientName) {
    return "CLIENTE debe tener datos.";
  }

  if (!form.cellphone.trim()) {
    return "Debe ingresar un celular.";
  }

  if (!form.department.trim() || !form.province.trim() || !form.district.trim()) {
    return "Debe seleccionar departamento, provincia y distrito.";
  }

  if (!form.address.trim()) {
    return "Debe ingresar una dirección.";
  }

  if (!form.addressNumber.trim()) {
    return "Debe ingresar un número.";
  }

  if (!form.contactedBy.length) {
    return "Debe seleccionar al menos una opción de contacto.";
  }

  return null;
}

interface ContactModalProps {
  isOpen: boolean;
  saving: boolean;
  editingContact: AdminContact | null;
  onClose: () => void;
  onSubmitContact: (payload: Omit<AdminContact, "id">, editingId: string | null) => Promise<void>;
}

function ContactModal({
  isOpen,
  saving,
  editingContact,
  onClose,
  onSubmitContact,
}: ContactModalProps) {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [ubigeoSelection, setUbigeoSelection] = useState<UbigeoSelection>(initialUbigeoSelection);
  const [validationError, setValidationError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;

    if (!editingContact) {
      setForm({
        ...initialForm,
        department: "LIMA",
        province: "LIMA",
        district: "LIMA",
        agency: "NINGUNO",
      });
      setUbigeoSelection(initialUbigeoSelection);
      setValidationError(null);
      return;
    }

    const { id: _id, client: _client, ...contactForm } = editingContact;
    setForm(contactForm);

    const departmentOption = findDepartmentOptionByName(editingContact.department);
    const provinceOption = departmentOption
      ? findProvinceOptionByName(departmentOption.code, editingContact.province)
      : undefined;
    const districtOption = departmentOption && provinceOption
      ? findDistrictOptionByName(departmentOption.code, provinceOption.code, editingContact.district)
      : undefined;

    setUbigeoSelection({
      departmentCode: departmentOption?.code || "",
      provinceCode: provinceOption?.code || "",
      districtCode: districtOption?.code || "",
    });
    setValidationError(null);
  }, [isOpen, editingContact]);

  const provinceOptions = useMemo(
    () => (ubigeoSelection.departmentCode ? getProvinceOptions(ubigeoSelection.departmentCode) : []),
    [ubigeoSelection.departmentCode],
  );

  const districtOptions = useMemo(
    () =>
      ubigeoSelection.departmentCode && ubigeoSelection.provinceCode
        ? getDistrictOptions(ubigeoSelection.departmentCode, ubigeoSelection.provinceCode)
        : [],
    [ubigeoSelection.departmentCode, ubigeoSelection.provinceCode],
  );

  const departmentNameByCode = useMemo(
    () => new Map(departmentOptions.map((option) => [option.code, option.name])),
    [],
  );
  const provinceNameByCode = useMemo(
    () => new Map(provinceOptions.map((option) => [option.code, option.name])),
    [provinceOptions],
  );
  const districtNameByCode = useMemo(
    () => new Map(districtOptions.map((option) => [option.code, option.name])),
    [districtOptions],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorMessage = validateContactForm(form);
    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setValidationError(null);
    const payload: Omit<AdminContact, "id"> = {
      ...form,
      // server expects `numero` (legacy) — ensure it's populated from addressNumber when empty
      numero: form.numero || form.addressNumber,
      client: buildClientName(form),
    };

    // Debug log: payload about to be submitted
    // eslint-disable-next-line no-console
    console.log("ContactModal: submitting payload", { editingId: editingContact?.id || null, payload });

    await onSubmitContact(payload, editingContact?.id || null);
  }

  return (
    <CrudModal
      isOpen={isOpen}
      title={editingContact ? `Editar contacto ${editingContact.id}` : "Registrar contacto"}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        {validationError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {validationError}
          </p>
        ) : null}
        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Identificación</h4>

          <div className="grid gap-3 sm:grid-cols-4 xl:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">TIPO DE DOCUMENTO</label>
              <select
                value={form.documentType}
                onChange={(event) => setForm((previous) => ({ ...previous, documentType: event.target.value as ContactForm["documentType"] }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
                <option value="RUC">RUC</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">DOCUMENTO</label>
              <input
                type="text"
                value={form.document}
                onChange={(event) => setForm((previous) => ({ ...previous, document: event.target.value }))}
                placeholder="DOCUMENTO"
                required
                inputMode={form.documentType === "DNI" || form.documentType === "RUC" ? "numeric" : "text"}
                pattern={form.documentType === "DNI" ? "\\d{8}" : form.documentType === "RUC" ? "\\d{11}" : undefined}
                title={
                  form.documentType === "DNI"
                    ? "El DNI debe tener 8 dígitos."
                    : form.documentType === "RUC"
                      ? "El RUC debe tener 11 dígitos."
                      : undefined
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">NACIMIENTO</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) => setForm((previous) => ({ ...previous, birthDate: event.target.value }))}
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">SEXO</label>
              <select
                value={form.sex}
                onChange={(event) => setForm((previous) => ({ ...previous, sex: event.target.value as ContactForm["sex"] }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              >
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMENINO">FEMENINO</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">CLASIFICACIÓN</label>
              <select
                value={form.classification}
                onChange={(event) => setForm((previous) => ({ ...previous, classification: event.target.value as ContactForm["classification"] }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              >
                <option value="MINORISTA">MINORISTA</option>
                <option value="MAYORISTA">MAYORISTA</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">APELLIDO PATERNO</label>
              <input
                type="text"
                value={form.lastNamePaterno}
                onChange={(event) => setForm((previous) => ({ ...previous, lastNamePaterno: event.target.value }))}
                placeholder="APELLIDO PATERNO"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">APELLIDO MATERNO</label>
              <input
                type="text"
                value={form.lastNameMaterno}
                onChange={(event) => setForm((previous) => ({ ...previous, lastNameMaterno: event.target.value }))}
                placeholder="APELLIDO MATERNO"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">NOMBRES</label>
              <input
                type="text"
                value={form.names}
                onChange={(event) => setForm((previous) => ({ ...previous, names: event.target.value }))}
                placeholder="NOMBRES"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">CLIENTE</label>
            <input
              type="text"
              value={buildClientName(form)}
              readOnly
              className="w-full mt-1 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-semibold uppercase text-zinc-700"
            />
          </div>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">CELULAR</label>
              <input
                type="text"
                value={form.cellphone}
                onChange={(event) => setForm((previous) => ({ ...previous, cellphone: event.target.value }))}
                placeholder="CELULAR"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">EMAIL</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                placeholder="EMAIL"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Ubicación</h4>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">DEPARTAMENTO</label>
              <select
                value={ubigeoSelection.departmentCode}
                onChange={(event) => {
                  const departmentCode = event.target.value;
                  setUbigeoSelection({
                    departmentCode,
                    provinceCode: "",
                    districtCode: "",
                  });
                  setForm((previous) => ({
                    ...previous,
                    department: departmentNameByCode.get(departmentCode) || "",
                    province: "",
                    district: "",
                  }));
                }}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              >
                <option value="">Selecciona departamento</option>
                {departmentOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">PROVINCIA</label>
              <select
                value={ubigeoSelection.provinceCode}
                onChange={(event) => {
                  const provinceCode = event.target.value;
                  setUbigeoSelection((previousSelection) => ({
                    ...previousSelection,
                    provinceCode,
                    districtCode: "",
                  }));
                  setForm((previous) => ({
                    ...previous,
                    province: provinceNameByCode.get(provinceCode) || "",
                    district: "",
                  }));
                }}
                disabled={!ubigeoSelection.departmentCode}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">{ubigeoSelection.departmentCode ? "Selecciona provincia" : "Primero selecciona departamento"}</option>
                {provinceOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">DISTRITO</label>
              <select
                value={ubigeoSelection.districtCode}
                onChange={(event) => {
                  const districtCode = event.target.value;
                  setUbigeoSelection((previousSelection) => ({
                    ...previousSelection,
                    districtCode,
                  }));
                  setForm((previous) => ({
                    ...previous,
                    district: districtNameByCode.get(districtCode) || "",
                  }));
                }}
                disabled={!ubigeoSelection.provinceCode}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">{ubigeoSelection.provinceCode ? "Selecciona distrito" : "Primero selecciona provincia"}</option>
                {districtOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">DIRECCIÓN</label>
              <input
                type="text"
                value={form.address}
                onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
                placeholder="DIRECCIÓN"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">NÚMERO</label>
              <input
                type="text"
                value={form.addressNumber}
                onChange={(event) => setForm((previous) => ({ ...previous, addressNumber: event.target.value }))}
                placeholder="NÚMERO"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">REFERENCIA</label>
              <input
                type="text"
                value={form.reference}
                onChange={(event) => setForm((previous) => ({ ...previous, reference: event.target.value }))}
                placeholder="REFERENCIA"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">AGENCIA</label>
              <select
                value={form.agency || "NINGUNO"}
                onChange={(event) => setForm((previous) => ({ ...previous, agency: event.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
              >
                {TRANSPORT_AGENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Contacto</h4>
          <div className="grid gap-3 sm:grid-cols-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600"></label>
              <div className="grid grid-cols-2 gap-2">
                {CONTACT_SOURCE_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.contactedBy.includes(option)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setForm((previous) => {
                          const set = new Set(previous.contactedBy || []);
                          if (checked) set.add(option);
                          else set.delete(option);
                          return { ...previous, contactedBy: Array.from(set) } as ContactForm;
                        });
                      }}
                      className="h-4 w-4"
                    />
                    <span className="uppercase">{option}</span>
                  </label>
                ))}
              </div>
              {form.contactedBy.includes("OTROS") ? (
                <input
                  type="text"
                  value={form.contactedByOther}
                  onChange={(event) => setForm((previous) => ({ ...previous, contactedByOther: event.target.value }))}
                  placeholder="OTROS (especificar)"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase"
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </CrudModal>
  );
}

export default memo(ContactModal);

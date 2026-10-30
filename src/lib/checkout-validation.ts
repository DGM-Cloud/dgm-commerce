import type { CheckoutDetails } from "@/lib/cart";
import { findShippingZone } from "@/lib/shipping-rates";

export type CheckoutField = keyof CheckoutDetails;

const personName = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const placeName = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .'\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function checkoutFieldError(field: CheckoutField, details: CheckoutDetails) {
  const value = details[field].trim();

  if (field === "firstName" || field === "lastName") {
    if (!value) return "Este campo es obligatorio.";
    if (value.length < 2 || !personName.test(value)) return "Escribe un nombre válido, solo letras.";
    return "";
  }

  if (field === "phone") {
    const phone = digits(value);
    if (!phone) return "Ingresa tu celular.";
    if (!/^9\d{8}$/.test(phone)) return "El celular debe tener 9 dígitos y empezar con 9.";
    return "";
  }

  if (field === "email") {
    if (!value) return "Ingresa tu email.";
    if (!emailPattern.test(value)) return "El email no es válido.";
    return "";
  }

  if (field === "documentNumber") {
    const compact = value.replace(/\s/g, "");
    if (details.documentType === "DNI") {
      if (!/^\d{8}$/.test(compact)) return "El DNI debe tener 8 dígitos.";
      return "";
    }
    if (details.documentType === "RUC") {
      if (!/^\d{11}$/.test(value.replace(/\s/g, ""))) return "El RUC debe tener 11 dígitos.";
      return "";
    }
    if (!/^[A-Za-z0-9]{8,12}$/.test(value.replace(/\s/g, ""))) return "El carnet debe tener entre 8 y 12 caracteres.";
    return "";
  }

  if (field === "deliveryMethod") {
    return value ? "" : "Elige cómo quieres recibir el pedido.";
  }

  if (field === "district" && details.deliveryMethod === "delivery-lima") {
    return findShippingZone(details.district) ? "" : "Selecciona tu distrito.";
  }

  if (field === "address" && details.deliveryMethod === "delivery-lima") {
    if (value.length < 5 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value)) return "Escribe una dirección válida.";
    return "";
  }

  if (field === "addressNumber") {
    if (!value) return "";
    if (!/^[0-9A-Za-z-]{1,8}$/.test(value)) return "El número no es válido.";
    return "";
  }

  if (field === "reference") {
    if (!value) return "";
    if (value.length < 3) return "La referencia es muy corta.";
    return "";
  }

  if (details.deliveryMethod === "agencia-provincia" && (field === "department" || field === "province" || field === "district")) {
    if (value.length < 3 || !placeName.test(value)) return "Escribe un nombre válido.";
    return "";
  }

  if (field === "agency" && details.deliveryMethod === "agencia-provincia") {
    if (value.length < 3) return "Indica la agencia Shalom más cercana.";
    return "";
  }

  return "";
}

function fieldsFor(details: CheckoutDetails): CheckoutField[] {
  const fields: CheckoutField[] = ["firstName", "lastName", "phone", "email", "documentNumber", "deliveryMethod"];

  if (details.deliveryMethod === "delivery-lima") {
    fields.push("district", "address", "addressNumber", "reference");
  }

  if (details.deliveryMethod === "agencia-provincia") {
    fields.push("department", "province", "district", "agency");
  }

  return fields;
}

export function checkoutErrors(details: CheckoutDetails) {
  const errors: Partial<Record<CheckoutField, string>> = {};

  for (const field of fieldsFor(details)) {
    const message = checkoutFieldError(field, details);
    if (message) errors[field] = message;
  }

  return errors;
}

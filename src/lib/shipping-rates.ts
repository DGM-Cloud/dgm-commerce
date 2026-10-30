export type ShippingZone = {
  name: string;
  rate: number;
  region: "Lima" | "Callao";
};

const CALLAO_ZONES = new Set([
  "Bellavista",
  "Callao",
  "Carmen de la Legua Reynoso",
  "El Márquez – Callao",
  "La Perla",
  "La Punta",
  "Mi Perú",
  "Ventanilla",
]);

const ZONE_RATES: Array<[string, number]> = [
  ["Ancón", 17],
  ["Ate", 12],
  ["Barranco", 10],
  ["Bellavista", 12],
  ["Breña", 8],
  ["Cajamarquilla", 21],
  ["Callao", 12],
  ["Carabayllo", 12],
  ["Carmen de la Legua Reynoso", 12],
  ["Cercado de Lima", 10],
  ["Chaclacayo", 17],
  ["Chorrillos", 12],
  ["Chosica", 22],
  ["Cieneguilla", 17],
  ["Comas", 12],
  ["El Agustino", 10],
  ["El Márquez – Callao", 12],
  ["Huachipa", 14],
  ["Huaycán", 12],
  ["Independencia", 12],
  ["Jesús María", 10],
  ["Jicamarca – Anexo 22", 14],
  ["Jicamarca – Anexo 8", 21],
  ["La Molina", 10],
  ["La Perla", 12],
  ["La Punta", 12],
  ["La Victoria", 10],
  ["Lince", 10],
  ["Los Olivos", 12],
  ["Lurigancho – Chosica", 14],
  ["Lurín", 14],
  ["Magdalena del Mar", 10],
  ["Manchay", 17],
  ["Mi Perú", 12],
  ["Miraflores", 10],
  ["Pachacámac", 19],
  ["Pucusana", 28],
  ["Pueblo Libre", 10],
  ["Puente Piedra", 12],
  ["Punta Hermosa", 17],
  ["Punta Negra", 21],
  ["Ricardo Palma", 25],
  ["Rímac", 10],
  ["Salamanca – Ate", 10],
  ["San Bartolo", 22],
  ["San Borja", 10],
  ["San Isidro", 10],
  ["San Juan de Lurigancho", 10],
  ["San Juan de Miraflores", 12],
  ["San Luis", 10],
  ["San Martín de Porres", 12],
  ["San Miguel", 10],
  ["Santa Anita", 10],
  ["Santa Clara – Ate", 12],
  ["Santa Eulalia", 25],
  ["Santa María del Mar", 25],
  ["Santa Rosa", 17],
  ["Santiago de Surco", 10],
  ["Surquillo", 10],
  ["Ventanilla", 12],
  ["Villa El Salvador", 12],
  ["Villa María del Triunfo", 12],
];

export const LIMA_DELIVERY_ZONES: ShippingZone[] = ZONE_RATES.map(([name, rate]): ShippingZone => ({
  name,
  rate,
  region: CALLAO_ZONES.has(name) ? "Callao" : "Lima",
})).sort((left, right) => left.name.localeCompare(right.name, "es"));

export function findShippingZone(name: string) {
  return LIMA_DELIVERY_ZONES.find((zone) => zone.name === name);
}

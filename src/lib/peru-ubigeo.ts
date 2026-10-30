import ubigeoPeru from "ubigeo-peru";

type UbigeoEntry = {
  departamento: string;
  provincia: string;
  distrito: string;
  nombre: string;
};

const reniecEntries = (ubigeoPeru as { reniec: UbigeoEntry[] }).reniec;

type Option = {
  code: string;
  name: string;
};

const departmentEntries = reniecEntries.filter((entry) => entry.provincia === "00" && entry.distrito === "00");

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

export const departmentOptions: Option[] = departmentEntries
  .map((entry) => ({ code: entry.departamento, name: entry.nombre }))
  .sort((left, right) => left.name.localeCompare(right.name, "es"));

const departmentByCode = new Map(departmentOptions.map((option) => [option.code, option]));
const departmentByNormalizedName = new Map(departmentOptions.map((option) => [normalizeLabel(option.name), option]));

const provinceOptionsByDepartment = new Map<string, Option[]>();
const provinceByNormalizedNameByDepartment = new Map<string, Map<string, Option>>();

for (const departmentOption of departmentOptions) {
  const provinces = reniecEntries
    .filter(
      (entry) =>
        entry.departamento === departmentOption.code &&
        entry.distrito === "00" &&
        entry.provincia !== "00",
    )
    .map((entry) => ({ code: entry.provincia, name: entry.nombre }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));

  provinceOptionsByDepartment.set(departmentOption.code, provinces);
  provinceByNormalizedNameByDepartment.set(
    departmentOption.code,
    new Map(provinces.map((option) => [normalizeLabel(option.name), option])),
  );
}

const districtOptionsByDepartmentProvince = new Map<string, Option[]>();
const districtByNormalizedNameByDepartmentProvince = new Map<string, Map<string, Option>>();

for (const [departmentCode, provinces] of provinceOptionsByDepartment) {
  for (const province of provinces) {
    const key = `${departmentCode}-${province.code}`;
    const districts = reniecEntries
      .filter(
        (entry) =>
          entry.departamento === departmentCode &&
          entry.provincia === province.code &&
          entry.distrito !== "00",
      )
      .map((entry) => ({ code: entry.distrito, name: entry.nombre }))
      .sort((left, right) => left.name.localeCompare(right.name, "es"));

    districtOptionsByDepartmentProvince.set(key, districts);
    districtByNormalizedNameByDepartmentProvince.set(
      key,
      new Map(districts.map((option) => [normalizeLabel(option.name), option])),
    );
  }
}

export function findDepartmentOptionByName(departmentName: string): Option | undefined {
  return departmentByNormalizedName.get(normalizeLabel(departmentName));
}

export function getProvinceOptions(departmentCode: string): Option[] {
  if (!departmentByCode.has(departmentCode)) return [];
  return provinceOptionsByDepartment.get(departmentCode) || [];
}

export function findProvinceOptionByName(departmentCode: string, provinceName: string): Option | undefined {
  const index = provinceByNormalizedNameByDepartment.get(departmentCode);
  if (!index) return undefined;
  return index.get(normalizeLabel(provinceName));
}

export function getDistrictOptions(departmentCode: string, provinceCode: string): Option[] {
  if (!departmentByCode.has(departmentCode)) return [];
  const key = `${departmentCode}-${provinceCode}`;
  return districtOptionsByDepartmentProvince.get(key) || [];
}

export function findDistrictOptionByName(departmentCode: string, provinceCode: string, districtName: string): Option | undefined {
  const key = `${departmentCode}-${provinceCode}`;
  const index = districtByNormalizedNameByDepartmentProvince.get(key);
  if (!index) return undefined;
  return index.get(normalizeLabel(districtName));
}
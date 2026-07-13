export const FTM_REGIONAL_OPTIONS = [
  "TREG 1",
  "TREG 2",
  "TREG 3",
  "TREG 4",
  "TREG 5",
  "TREG 6",
  "TREG 7",
] as const;

export const FTM_WILAYAH_OPTIONS = [
  "TIF 1",
  "TIF 2",
  "TIF 3",
  "TIF 4",
  "TIF 5",
] as const;

export type FtmRegionalLabel = (typeof FTM_REGIONAL_OPTIONS)[number];
export type FtmWilayahLabel = (typeof FTM_WILAYAH_OPTIONS)[number];

export const DEFAULT_REGIONAL_LABEL: FtmRegionalLabel = "TREG 5";
export const DEFAULT_WILAYAH_LABEL: FtmWilayahLabel = "TIF 3";

function normalizeOptionText(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeOptionKey(value?: string | null): string {
  return normalizeOptionText(value).replace(/\s+/g, "");
}

export function normalizeRegionalLabel(
  value?: string | null,
): FtmRegionalLabel | null {
  const normalizedValue = normalizeOptionText(value);
  const match = FTM_REGIONAL_OPTIONS.find(
    (option) => option.toUpperCase() === normalizedValue,
  );

  return match ?? null;
}

export function normalizeWilayahLabel(
  value?: string | null,
): FtmWilayahLabel | null {
  const normalizedValue = normalizeOptionText(value);
  const match = FTM_WILAYAH_OPTIONS.find(
    (option) => normalizeOptionKey(option) === normalizeOptionKey(normalizedValue),
  );

  return match ?? null;
}

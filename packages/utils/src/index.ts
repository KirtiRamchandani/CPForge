export const isoDate = (date = new Date()): string => date.toISOString().slice(0, 10);

export const addDays = (date: string | Date, days: number): string => {
  const parsed = typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : new Date(date);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return isoDate(parsed);
};

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const stableId = (...parts: Array<string | number | undefined>): string =>
  parts
    .filter((part): part is string | number => part !== undefined && String(part).length > 0)
    .map((part) => slugify(String(part)))
    .join("-");

export const unique = <T>(items: T[]): T[] => [...new Set(items)];

export const groupBy = <T>(items: T[], key: (item: T) => string): Record<string, T[]> =>
  items.reduce<Record<string, T[]>>((groups, item) => {
    const group = key(item);
    groups[group] ??= [];
    groups[group].push(item);
    return groups;
  }, {});

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const formatPercent = (value: number): string => `${Math.round(value)}%`;

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function countWords(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

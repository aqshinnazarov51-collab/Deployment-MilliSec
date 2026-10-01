export function parseUsdToCents(value: string) {
  const input = value.trim();
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(input)) return null;
  const [whole, fraction = ""] = input.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function isIdempotencyKey(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

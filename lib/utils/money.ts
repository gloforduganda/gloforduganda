/**
 * Money helpers. We always store money as integer cents + currency code;
 * formatting is a pure presentational concern.
 *
 * Zero-decimal currencies (UGX, JPY, etc.) have no minor units — amounts ARE
 * already in the major unit, so we never divide by 100 for them.
 */

const ZERO_DECIMAL_CURRENCIES = new Set([
  "UGX", "JPY", "KRW", "VND", "BIF", "GNF", "ISK", "KMF", "MGA",
  "PYG", "RWF", "TZS", "XAF", "XOF", "XPF",
]);

export function formatMoney(cents: number, currency = "USD", locale?: string): string {
  const cur = currency.toUpperCase();
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(cur);
  const amount = isZeroDecimal ? cents : cents / 100;
  // Show 2 fraction digits only when there is a fractional part (e.g. $50.50 not $50.5)
  const minFrac = isZeroDecimal ? 0 : cents % 100 !== 0 ? 2 : 0;
  const maxFrac = isZeroDecimal ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(amount);
}

/** Suggested preset amounts in cents for a given currency. */
export function defaultPresets(currency: string): number[] {
  const c = currency.toUpperCase();
  if (c === "USD" || c === "EUR" || c === "GBP") return [2500, 5000, 10000, 25000];
  if (c === "KES") return [50000, 100000, 250000, 500000];
  if (ZERO_DECIMAL_CURRENCIES.has(c)) return [25000, 50000, 100000, 250000];
  return [2500, 5000, 10000, 25000];
}

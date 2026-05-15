export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const currencyFormatter = new Intl.NumberFormat("en-MW", {
  style: "currency",
  currency: "MWK",
  maximumFractionDigits: 0,
});

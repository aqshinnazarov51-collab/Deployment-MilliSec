import { getCatalogContent } from "@/lib/catalog-content";

export function getSalePrice(price: number, slug?: string) {
  const original = slug ? getCatalogContent(slug)?.originalPrice ?? null : null;
  return { current: price, original };
}

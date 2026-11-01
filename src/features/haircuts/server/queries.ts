import { tenantDb } from "@/server/db/tenant";

export function getHaircuts(shopId: string, category?: string) {
  return tenantDb(shopId).haircuts.list(category);
}

export function getHaircutBySlug(shopId: string, slug: string) {
  return tenantDb(shopId).haircuts.bySlug(slug);
}

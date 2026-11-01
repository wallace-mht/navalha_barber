import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { shops } from "@/server/db/schema";
import { getEnv } from "@/lib/env";

/**
 * O host define a barbearia: domínio próprio, depois subdomínio da plataforma.
 * DEFAULT_SHOP_SLUG serve só para demonstração (ex.: URL de preview da Vercel).
 * Não grava nada: barbearias são criadas por script, nunca durante uma leitura.
 */
export async function getShopByHost(rawHost: string) {
  const db = getDb();
  const host = rawHost.toLowerCase().split(":")[0];
  const env = getEnv();

  const byDomain = await db.select().from(shops).where(eq(shops.domain, host)).limit(1);
  if (byDomain[0]) return byDomain[0];

  const root = env.PLATFORM_ROOT_DOMAIN?.toLowerCase();
  if (root && host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1)).split(".").pop() ?? "";
    const bySlug = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
    return bySlug[0] ?? null;
  }

  if (env.DEFAULT_SHOP_SLUG) {
    const fallback = await db.select().from(shops).where(eq(shops.slug, env.DEFAULT_SHOP_SLUG)).limit(1);
    return fallback[0] ?? null;
  }
  return null;
}

import { and, eq } from "drizzle-orm";
import { getDb } from "./index";
import { haircuts, queueStatus } from "./schema";

/**
 * Único caminho para consultas de negócio: toda leitura já sai filtrada por shop_id.
 * Novas tabelas de negócio entram aqui, nunca direto em getDb().
 */
export function tenantDb(shopId: string) {
  const db = getDb();
  return {
    shopId,
    haircuts: {
      list: (category?: string) =>
        db
          .select()
          .from(haircuts)
          .where(
            and(
              eq(haircuts.shopId, shopId),
              eq(haircuts.active, true),
              category ? eq(haircuts.category, category) : undefined,
            ),
          ),
      bySlug: async (slug: string) => {
        const rows = await db
          .select()
          .from(haircuts)
          .where(and(eq(haircuts.shopId, shopId), eq(haircuts.slug, slug)))
          .limit(1);
        return rows[0] ?? null;
      },
    },
    queueStatus: {
      get: async () => {
        const rows = await db
          .select()
          .from(queueStatus)
          .where(eq(queueStatus.shopId, shopId))
          .limit(1);
        return rows[0] ?? null;
      },
    },
  };
}

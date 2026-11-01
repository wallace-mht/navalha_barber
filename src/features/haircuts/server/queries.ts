import { db } from "@/server/db";
import { haircuts, queueStatus, shops } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function getShopByHost(host: string) {
  // Em ambiente de produção, resolve pelo domínio ou subdomínio
  // No MVP local, buscamos o primeiro ou por slug/domain
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, "matriz"),
  });

  if (!shop) {
    // Cria uma barbearia padrão se não existir para o MVP funcionar sem falhas
    const [newShop] = await db.insert(shops).values({
      name: "Barbearia Parnaíba",
      slug: "matriz",
      accentColor: "#e6be8c",
    }).returning();
    return newShop;
  }

  return shop;
}

export async function getHaircuts(shopId: string, category?: string) {
  const conditions = [eq(haircuts.shopId, shopId), eq(haircuts.active, true)];

  if (category) {
    conditions.push(eq(haircuts.category, category));
  }

  return await db.select().from(haircuts).where(and(...conditions));
}

export async function getHaircutBySlug(shopId: string, slug: string) {
  return await db.query.haircuts.findFirst({
    where: and(eq(haircuts.shopId, shopId), eq(haircuts.slug, slug)),
  });
}

export async function getQueueStatus(shopId: string) {
  const status = await db.query.queueStatus.findFirst({
    where: eq(queueStatus.shopId, shopId),
  });

  if (!status) {
    const [newStatus] = await db.insert(queueStatus).values({
      shopId,
      status: "normal",
      estimatedMinutes: 20,
    }).returning();
    return newStatus;
  }

  return status;
}

import { tenantDb } from "@/server/db/tenant";

export function getQueueStatus(shopId: string) {
  return tenantDb(shopId).queueStatus.get();
}

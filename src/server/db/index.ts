import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Cliente de banco genérico para conexões gerais ou migrações
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/barbearia";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

// Helper para consultas multi-tenant isoladas por shopId
export function tenantDb(shopId: string) {
  // Retorna um proxy ou helper que injeta o shopId nas queries se necessário,
  // ou encapsula as chamadas garantindo o isolamento.
  return {
    shopId,
    // Futuras queries filtradas automaticamente podem ser adicionadas aqui
  };
}

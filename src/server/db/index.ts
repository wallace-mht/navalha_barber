import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type Db = ReturnType<typeof create>;

function create() {
  return drizzle(neon(getEnv().DATABASE_URL), { schema });
}

let instance: Db | undefined;

/** Conexão criada sob demanda: importar este módulo não abre conexão nem lê variáveis. */
export function getDb(): Db {
  instance ??= create();
  return instance;
}

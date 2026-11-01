import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PLATFORM_ROOT_DOMAIN: z.string().optional(),
  DEFAULT_SHOP_SLUG: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Valida o ambiente na primeira leitura (nunca no import, para não quebrar o build). */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

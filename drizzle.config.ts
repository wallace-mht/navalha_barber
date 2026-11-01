import type { Config } from "drizzle-kit";

// O drizzle-kit não carrega o .env sozinho. No Node 20.12+ usamos loadEnvFile;
// sem .env (ou em Node mais antigo), segue só com as variáveis do terminal.
try {
  process.loadEnvFile();
} catch {
  // sem .env: usa o ambiente do terminal
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn(
    "[drizzle] DATABASE_URL não definida. Crie um arquivo .env na raiz com DATABASE_URL=<string do Neon>, sem aspas e sem o prefixo 'psql'.",
  );
}

export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url as string,
  },
} satisfies Config;

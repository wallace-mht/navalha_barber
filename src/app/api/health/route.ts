import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { haircuts, queueStatus, shops } from "@/server/db/schema";

// Diagnóstico temporário da demonstração: só devolve "ok"/mensagens curtas, nunca valores
// de variáveis. Remova esta rota (ou proteja com login) antes de usar com clientes reais.
export const dynamic = "force-dynamic";

function curto(e: unknown): string {
  const err = e as { message?: string; cause?: { message?: string } };
  const texto = err?.cause?.message ?? err?.message ?? String(e);
  return texto.replace(/postgres(ql)?:\/\/\S+/gi, "[url]").slice(0, 200);
}

async function tentar(fn: () => PromiseLike<unknown>): Promise<string> {
  try {
    await fn();
    return "ok";
  } catch (e) {
    return curto(e);
  }
}

export async function GET() {
  const variaveis = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DEFAULT_SHOP_SLUG: process.env.DEFAULT_SHOP_SLUG ?? null,
  };

  if (!variaveis.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        etapa: "variaveis",
        variaveis,
        dica: "Cadastre DATABASE_URL na Vercel (Production e Preview) e faça Redeploy.",
      },
      { status: 503 },
    );
  }

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        etapa: "conexao",
        erro: curto(e),
        dica: "Confira a string: sem aspas, sem o prefixo 'psql' e começando com postgresql://",
      },
      { status: 503 },
    );
  }

  const tabelas = {
    shops: await tentar(() => db.select().from(shops).limit(1)),
    haircuts: await tentar(() => db.select().from(haircuts).limit(1)),
    queue_status: await tentar(() => db.select().from(queueStatus).limit(1)),
  };

  const slug = variaveis.DEFAULT_SHOP_SLUG;
  const barbeariaPadrao = slug
    ? await tentar(async () => {
        const rows = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
        if (!rows[0]) throw new Error(`barbearia "${slug}" não existe: rode o scripts/seed.sql`);
      })
    : "DEFAULT_SHOP_SLUG não definida";

  const ok = Object.values(tabelas).every((v) => v === "ok") && barbeariaPadrao === "ok";
  return NextResponse.json(
    { ok, variaveis, tabelas, barbearia_padrao: barbeariaPadrao },
    { status: ok ? 200 : 503 },
  );
}

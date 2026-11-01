import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getShopByHost } from "@/server/tenant/resolve";
import { getHaircuts } from "@/features/haircuts/server/queries";
import { getQueueStatus } from "@/features/queue/server/queries";
import { getQueueDisplayState } from "@/features/queue/server/domain";

// A página lê banco e host a cada requisição: nunca pode ser gerada no build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const host = (await headers()).get("host") ?? "";
  const shop = await getShopByHost(host);
  if (!shop) notFound();

  const [haircutsList, queue] = await Promise.all([
    getHaircuts(shop.id),
    getQueueStatus(shop.id),
  ]);

  const state = queue
    ? getQueueDisplayState(queue.status, queue.estimatedMinutes, queue.updatedAt, new Date())
    : { label: "Fila sem informação", minutes: null, isOutdated: true, displayStatus: "desatualizado" };

  return (
    <div className="flex min-h-screen flex-col p-4">
      <header className="flex items-center justify-between py-6">
        <h1 className="text-3xl font-light tracking-tight">{shop.name}</h1>
      </header>

      <section aria-labelledby="fila" className="my-12 flex flex-col items-center text-center">
        <h2 id="fila" className="sr-only">Fila de espera</h2>
        <p className="text-6xl font-light text-brasa">{state.label}</p>
        {state.minutes !== null && (
          <p className="mt-2 text-nevoa">{state.minutes} min de espera</p>
        )}
      </section>

      <section aria-labelledby="cortes">
        <h2 id="cortes" className="mb-6 text-2xl font-light">Cortes</h2>
        {haircutsList.length === 0 ? (
          <p className="text-nevoa">A barbearia ainda não cadastrou cortes.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {haircutsList.map((cut) => (
              <li key={cut.id} className="rounded-cartao border border-vidro-borda bg-vidro p-6">
                <h3 className="text-xl font-medium">{cut.name}</h3>
                <p className="text-sm text-nevoa">{cut.category}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

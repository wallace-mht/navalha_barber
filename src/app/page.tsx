import { getShopByHost, getHaircuts, getQueueStatus } from "@/features/haircuts/server/queries";
import { getQueueDisplayState } from "@/features/queue/server/domain"; // Note: reuse logic

export default async function Home() {
  const shop = await getShopByHost("matriz");
  const haircutsList = await getHaircuts(shop.id);
  const queue = await getQueueStatus(shop.id);

  const queueState = getQueueDisplayState(queue.updatedAt, queue.status, queue.estimatedMinutes);

  return (
    <div className="flex flex-col min-h-screen bg-noite text-offwhite p-4">
      <header className="flex justify-between items-center py-6">
        <h1 className="text-3xl font-light tracking-tight">{shop.name}</h1>
      </header>

      <section className="my-12">
        <div className="flex flex-col items-center">
            <div className="text-6xl font-light text-brasa">{queueState.label}</div>
            <div className="text-nevoa mt-2">{queueState.minutes ? `${queueState.minutes} min de espera` : ""}</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-light mb-6">Cortes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {haircutsList.map((cut) => (
            <div key={cut.id} className="bg-vidro border border-vidro-borda rounded-2xl p-6">
              <h3 className="text-xl font-medium">{cut.name}</h3>
              <p className="text-nevoa text-sm">{cut.category}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

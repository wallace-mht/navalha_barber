import { describe, expect, it } from "vitest";
import { getQueueDisplayState, QUEUE_STALE_AFTER_MINUTES } from "./domain";

const now = new Date("2026-11-01T12:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe("getQueueDisplayState", () => {
  it("mostra desatualizado depois de 120 min, sem minutos", () => {
    const r = getQueueDisplayState("normal", 20, minutesAgo(180), now);
    expect(r.isOutdated).toBe(true);
    expect(r.label).toBe("Status desatualizado");
    expect(r.minutes).toBeNull();
  });

  it("borda: exatamente 120 min ainda é atual; 120 min e 1 s já é desatualizado", () => {
    expect(getQueueDisplayState("normal", 20, minutesAgo(QUEUE_STALE_AFTER_MINUTES), now).isOutdated).toBe(false);
    const justOver = new Date(now.getTime() - (QUEUE_STALE_AFTER_MINUTES * 60_000 + 1000));
    expect(getQueueDisplayState("normal", 20, justOver, now).isOutdated).toBe(true);
  });

  it("mostra fila normal com os minutos quando está atual", () => {
    const r = getQueueDisplayState("normal", 15, minutesAgo(30), now);
    expect(r.label).toBe("Fila normal");
    expect(r.minutes).toBe(15);
  });

  it("mostra sem fila", () => {
    const r = getQueueDisplayState("empty", 0, minutesAgo(5), now);
    expect(r.label).toBe("Sem fila");
    expect(r.minutes).toBe(0);
  });

  it("pausa e fechado não mostram minutos", () => {
    expect(getQueueDisplayState("paused", 10, minutesAgo(5), now).minutes).toBeNull();
    expect(getQueueDisplayState("closed", 10, minutesAgo(5), now).minutes).toBeNull();
  });

  it("relógio adiantado (atualização no futuro) não vira desatualizado", () => {
    const future = new Date(now.getTime() + 5 * 60_000);
    expect(getQueueDisplayState("normal", 20, future, now).isOutdated).toBe(false);
  });

  it("estado desconhecido nunca é apresentado como fila normal", () => {
    const r = getQueueDisplayState("qualquer-coisa", 20, minutesAgo(5), now);
    expect(r.label).toBe("Status indisponível");
    expect(r.minutes).toBeNull();
  });
});

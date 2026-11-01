/** Única definição da validade do status da fila (120 min por padrão). */
export const QUEUE_STALE_AFTER_MINUTES = 120;

export type QueueDisplayState = {
  displayStatus: "empty" | "normal" | "full" | "paused" | "closed" | "desatualizado" | "desconhecido";
  label: string;
  minutes: number | null;
  isOutdated: boolean;
};

/** Função pura: `now` é sempre explícito. */
export function getQueueDisplayState(
  status: string,
  estimatedMinutes: number,
  updatedAt: Date,
  now: Date,
  staleAfterMinutes: number = QUEUE_STALE_AFTER_MINUTES,
): QueueDisplayState {
  const ageMinutes = Math.max(0, (now.getTime() - updatedAt.getTime()) / 60_000);

  if (ageMinutes > staleAfterMinutes) {
    return { displayStatus: "desatualizado", label: "Status desatualizado", minutes: null, isOutdated: true };
  }

  switch (status) {
    case "empty":
      return { displayStatus: "empty", label: "Sem fila", minutes: 0, isOutdated: false };
    case "normal":
      return { displayStatus: "normal", label: "Fila normal", minutes: estimatedMinutes, isOutdated: false };
    case "full":
      return { displayStatus: "full", label: "Fila cheia", minutes: estimatedMinutes, isOutdated: false };
    case "paused":
      return { displayStatus: "paused", label: "Pausa", minutes: null, isOutdated: false };
    case "closed":
      return { displayStatus: "closed", label: "Fechado", minutes: null, isOutdated: false };
    default:
      // Estado desconhecido nunca vira "Fila normal": melhor não informar do que informar errado.
      return { displayStatus: "desconhecido", label: "Status indisponível", minutes: null, isOutdated: true };
  }
}

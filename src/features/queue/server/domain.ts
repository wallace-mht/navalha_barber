export function getQueueDisplayState(
  updatedAt: Date,
  status: string,
  estimatedMinutes: number,
  now: Date = new Date(),
  maxAgeHours: number = 2
) {
  const diffMs = now.getTime() - updatedAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours > maxAgeHours) {
    return {
      displayStatus: "desatualizado",
      label: "Status desatualizado",
      minutes: null,
      isOutdated: true,
    };
  }

  switch (status) {
    case "empty":
      return {
        displayStatus: "empty",
        label: "Sem fila",
        minutes: 0,
        isOutdated: false,
      };
    case "normal":
      return {
        displayStatus: "normal",
        label: "Fila normal",
        minutes: estimatedMinutes,
        isOutdated: false,
      };
    case "full":
      return {
        displayStatus: "full",
        label: "Fila cheia",
        minutes: estimatedMinutes,
        isOutdated: false,
      };
    case "paused":
      return {
        displayStatus: "paused",
        label: "Pausa",
        minutes: null,
        isOutdated: false,
      };
    case "closed":
      return {
        displayStatus: "closed",
        label: "Fechado",
        minutes: null,
        isOutdated: false,
      };
    default:
      return {
        displayStatus: "normal",
        label: "Fila normal",
        minutes: estimatedMinutes,
        isOutdated: false,
      };
  }
}

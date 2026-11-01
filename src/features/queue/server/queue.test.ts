import { describe, expect, it } from "vitest";
import { getQueueDisplayState } from "./domain";

describe("Queue Domain Rules", () => {
  const now = new Date("2026-11-01T12:00:00Z");

  it("returns outdated when status is older than 2 hours", () => {
    const oldDate = new Date("2026-11-01T09:00:00Z"); // 3 hours ago
    const result = getQueueDisplayState(oldDate, "normal", 20, now);
    expect(result.isOutdated).toBe(true);
    expect(result.label).toBe("Status desatualizado");
    expect(result.minutes).toBeNull();
  });

  it("returns correct normal state when fresh", () => {
    const recentDate = new Date("2026-11-01T11:30:00Z"); // 30 min ago
    const result = getQueueDisplayState(recentDate, "normal", 15, now);
    expect(result.isOutdated).toBe(false);
    expect(result.label).toBe("Fila normal");
    expect(result.minutes).toBe(15);
  });

  it("returns empty state correctly", () => {
    const recentDate = new Date("2026-11-01T11:55:00Z");
    const result = getQueueDisplayState(recentDate, "empty", 0, now);
    expect(result.label).toBe("Sem fila");
    expect(result.minutes).toBe(0);
  });
});

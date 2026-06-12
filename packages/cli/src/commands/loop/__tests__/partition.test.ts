import { describe, it, expect } from "vitest";
import { partitionDueReminders } from "../post-actions.js";

describe("partitionDueReminders", () => {
  const NOW = new Date("2026-06-12T12:00:00Z").getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  it("returns empty arrays for empty input", () => {
    const r = partitionDueReminders([], NOW);
    expect(r.due).toEqual([]);
    expect(r.pending).toEqual([]);
  });

  it("puts reminders past their deadline in 'due'", () => {
    const r = partitionDueReminders(
      [
        {
          startDate: new Date(NOW - 31 * oneDay).toISOString(),
          days: 30,
          prompt: "30-day check-in",
        },
      ],
      NOW,
    );
    expect(r.due).toHaveLength(1);
    expect(r.pending).toHaveLength(0);
  });

  it("keeps reminders before their deadline in 'pending'", () => {
    const r = partitionDueReminders(
      [
        {
          startDate: new Date(NOW - 5 * oneDay).toISOString(),
          days: 30,
          prompt: "Future check-in",
        },
      ],
      NOW,
    );
    expect(r.due).toHaveLength(0);
    expect(r.pending).toHaveLength(1);
  });

  it("treats a reminder at exactly the deadline as due", () => {
    const r = partitionDueReminders(
      [
        {
          startDate: new Date(NOW - 30 * oneDay).toISOString(),
          days: 30,
          prompt: "Right at deadline",
        },
      ],
      NOW,
    );
    expect(r.due).toHaveLength(1);
  });

  it("partitions mixed sets correctly", () => {
    const r = partitionDueReminders(
      [
        { startDate: new Date(NOW - 31 * oneDay).toISOString(), days: 30, prompt: "old" },
        { startDate: new Date(NOW - 1 * oneDay).toISOString(), days: 30, prompt: "new" },
      ],
      NOW,
    );
    expect(r.due.map((x) => x.prompt)).toEqual(["old"]);
    expect(r.pending.map((x) => x.prompt)).toEqual(["new"]);
  });

  it("treats invalid date strings as never-due (kept in pending)", () => {
    // NaN comparisons are always false, so a corrupt reminder is kept
    // in 'pending' (never surfaced) and the user can fix config later.
    const r = partitionDueReminders(
      [
        { startDate: "not a date", days: 30, prompt: "garbage" },
      ],
      NOW,
    );
    expect(r.due).toEqual([]);
    expect(r.pending).toHaveLength(1);
  });
});

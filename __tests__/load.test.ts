import { describe, expect, it } from "vitest";
import { getLoadSuggestions } from "../lib/load";
import type { Task } from "../lib/types";

function task(
  id: string,
  dueDate: string,
  durationMin: number,
  parentId: string | null = null,
): Task {
  return {
    id,
    title: id,
    dueDate,
    durationMin,
    classId: null,
    isBig: false,
    done: false,
    doneAt: null,
    parentId,
    createdAt: "2026-10-01T12:00:00.000Z",
  };
}

describe("getLoadSuggestions", () => {
  it("splits tasks over 90 minutes into sessions no longer than 60 minutes", () => {
    const suggestions = getLoadSuggestions(
      [task("lab", "2026-10-09", 150), task("quiz", "2026-10-09", 45)],
      "2026-10-07",
      "2026-10-13",
      180,
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].sessions.map((session) => session.durationMin)).toEqual([
      60, 60, 30,
    ]);
    expect(suggestions[0].sessions.map((session) => session.dueDate)).toEqual([
      "2026-10-07",
      "2026-10-08",
      "2026-10-07",
    ]);
  });

  it("does not suggest work when an overloaded task has no lighter earlier day", () => {
    const suggestions = getLoadSuggestions(
      [task("exam", "2026-10-07", 240)],
      "2026-10-07",
      "2026-10-13",
      180,
    );

    expect(suggestions).toEqual([]);
  });

  it("does not suggest on days at or below the overload threshold", () => {
    const suggestions = getLoadSuggestions(
      [task("reading", "2026-10-09", 180)],
      "2026-10-07",
      "2026-10-13",
      180,
    );

    expect(suggestions).toEqual([]);
  });

  it("does not repeat suggestions after sessions already exist for a task", () => {
    const suggestions = getLoadSuggestions(
      [
        task("project", "2026-10-09", 240),
        task("session", "2026-10-07", 60, "project"),
      ],
      "2026-10-07",
      "2026-10-13",
      180,
    );

    expect(suggestions).toEqual([]);
  });

  it("does not suggest sessions for completed tasks", () => {
    const completed = { ...task("essay", "2026-10-09", 210), done: true };

    expect(
      getLoadSuggestions(
        [completed],
        "2026-10-07",
        "2026-10-13",
        180,
      ),
    ).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "../lib/parse";

const monday = new Date(2026, 6, 6, 12);

describe("parseQuickAdd", () => {
  it.each([
    ["chem lab report fri 90m #chem", "chem lab report", "2026-07-10", 90, "chem", false],
    ["Read chapter tomorrow", "Read chapter", "2026-07-07", 30, null, false],
    ["Essay next tuesday 1h", "Essay", "2026-07-14", 60, null, false],
    ["Quiz in 3 days", "Quiz", "2026-07-09", 30, null, false],
    ["Study fri", "Study", "2026-07-10", 30, null, false],
    ["Review notes 1.5h", "Review notes", null, 90, null, false],
    ["Project 2h30m", "Project", null, 150, null, false],
    ["Read 45m", "Read", null, 45, null, false],
    ["Prepare slides #history", "Prepare slides", null, 30, "history", false],
    ["Final exam next friday!", "Final exam", "2026-07-17", 30, null, true],
    ["Lab report fri 90m #BIO-101!", "Lab report", "2026-07-10", 90, "BIO-101", true],
    ["Task 2h 30m", "Task", null, 150, null, false],
    ["Task   tomorrow   20m", "Task", "2026-07-07", 20, null, false],
    ["#math 30m Homework", "Homework", null, 30, "math", false],
    ["Submit paper on July 20", "Submit paper", "2026-07-20", 30, null, false],
    ["Read next week", "Read", "2026-07-13", 30, null, false],
    ["No date or duration", "No date or duration", null, 30, null, false],
    ["   ", "", null, 30, null, false],
  ])(
    "parses %s",
    (input, title, dueDate, durationMin, className, isBig) => {
      expect(parseQuickAdd(input, monday)).toMatchObject({
        title,
        dueDate,
        durationMin,
        className,
        isBig,
      });
    },
  );

  it("uses the supplied default duration", () => {
    expect(parseQuickAdd("Read tomorrow", monday, 45).durationMin).toBe(45);
  });

  it("resolves a weekday on the reference weekday to the following week", () => {
    const friday = new Date(2026, 6, 10, 12);
    expect(parseQuickAdd("Read fri", friday).dueDate).toBe("2026-07-17");
  });

  it("reports whether a duration was explicitly supplied", () => {
    expect(parseQuickAdd("Read", monday).hasDuration).toBe(false);
    expect(parseQuickAdd("Read 30m", monday).hasDuration).toBe(true);
  });
});

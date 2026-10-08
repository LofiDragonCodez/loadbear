import { parse as parseChrono } from "chrono-node";

export type QuickAddResult = {
  title: string;
  dueDate: string | null;
  durationMin: number;
  className: string | null;
  isBig: boolean;
  hasDuration: boolean;
};

const DURATION_PATTERN =
  /\b(?:(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m)?|(\d+)\s*m)\b/gi;
const CLASS_PATTERN = /#([a-z0-9_-]+)/i;

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function durationFromMatch(match: RegExpExecArray): number {
  if (match[1] !== undefined) {
    return Math.round(
      Number(match[1]) * 60 + (match[2] === undefined ? 0 : Number(match[2])),
    );
  }
  return Number(match[3]);
}

export function parseQuickAdd(
  input: string,
  referenceDate: Date = new Date(),
  defaultDurationMin = 30,
): QuickAddResult {
  let remaining = input.trim();
  let dueDate: string | null = null;
  let isBig = false;

  if (/!\s*$/.test(remaining)) {
    isBig = true;
    remaining = remaining.replace(/!\s*$/, " ");
  }

  let durationMin = defaultDurationMin;
  let hasDuration = false;
  const durationMatches = [...remaining.matchAll(DURATION_PATTERN)];
  const durationMatch = durationMatches[0];
  if (durationMatch && durationMatch.index !== undefined) {
    durationMin = durationFromMatch(durationMatch);
    hasDuration = true;
    remaining =
      remaining.slice(0, durationMatch.index) +
      " " +
      remaining.slice(durationMatch.index + durationMatch[0].length);
  }

  const dateResult = parseChrono(remaining, referenceDate, {
    forwardDate: true,
  })[0];
  if (dateResult) {
    const date = dateResult.start.date();
    const weekdayOnly =
      /^(?:sun|mon|tues|wednes|thurs|fri|satur)(?:day)?$/i.test(
        dateResult.text.trim(),
      );
    const sameLocalDay =
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth() &&
      date.getDate() === referenceDate.getDate();
    if (weekdayOnly && sameLocalDay) {
      date.setDate(date.getDate() + 7);
    }
    dueDate = toLocalDateString(date);
    remaining =
      remaining.slice(0, dateResult.index) +
      " " +
      remaining.slice(dateResult.index + dateResult.text.length);
    remaining = remaining.replace(/\b(?:on|by|at)\s*$/i, " ");
  }

  const classMatch = CLASS_PATTERN.exec(remaining);
  const className = classMatch?.[1] ?? null;
  if (classMatch?.index !== undefined) {
    remaining =
      remaining.slice(0, classMatch.index) +
      " " +
      remaining.slice(classMatch.index + classMatch[0].length);
  }

  return {
    title: remaining.replace(/\s+/g, " ").trim(),
    dueDate,
    durationMin,
    className,
    isBig,
    hasDuration,
  };
}

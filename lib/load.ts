import type { Task } from "./types";

export type WorkSession = {
  dueDate: string;
  durationMin: number;
};

export type LoadSuggestion = {
  overloadedDate: string;
  task: Task;
  sessions: WorkSession[];
};

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getLoadSuggestions(
  tasks: Task[],
  today: string,
  weekEnd: string,
  mediumMax: number,
): LoadSuggestion[] {
  const activeTasks = tasks.filter((task) => !task.done && task.dueDate);
  const dayLoads = new Map<string, number>();
  for (const task of activeTasks) {
    const dueDate = task.dueDate!;
    dayLoads.set(dueDate, (dayLoads.get(dueDate) ?? 0) + task.durationMin);
  }

  const parentsWithSessions = new Set(
    tasks.filter((task) => task.parentId).map((task) => task.parentId),
  );
  const suggestions: LoadSuggestion[] = [];

  for (let overloadedDate = today; overloadedDate <= weekEnd; overloadedDate = addDays(overloadedDate, 1)) {
    const overloadedMinutes = dayLoads.get(overloadedDate) ?? 0;
    if (overloadedMinutes <= mediumMax) continue;

    const candidateTasks = activeTasks
      .filter(
        (task) =>
          task.parentId === null &&
          task.dueDate === overloadedDate &&
          task.durationMin > 0 &&
          !parentsWithSessions.has(task.id),
      )
      .sort((left, right) => right.durationMin - left.durationMin);

    for (const task of candidateTasks) {
      const lighterDays: string[] = [];
      for (let date = today; date < overloadedDate; date = addDays(date, 1)) {
        if ((dayLoads.get(date) ?? 0) < overloadedMinutes) lighterDays.push(date);
      }
      lighterDays.sort(
        (left, right) =>
          (dayLoads.get(left) ?? 0) - (dayLoads.get(right) ?? 0) ||
          left.localeCompare(right),
      );
      if (lighterDays.length === 0) continue;

      const sessionLimit = task.durationMin > 90 ? 60 : task.durationMin;
      const sessions: WorkSession[] = [];
      let remaining = task.durationMin;
      let sessionIndex = 0;
      while (remaining > 0) {
        const durationMin = Math.min(sessionLimit, remaining);
        sessions.push({
          dueDate: lighterDays[sessionIndex % lighterDays.length],
          durationMin,
        });
        remaining -= durationMin;
        sessionIndex += 1;
      }

      suggestions.push({ overloadedDate, task, sessions });
      break;
    }
  }

  return suggestions;
}

"use client";

import type { Task } from "@/lib/types";

type BigStuffStripProps = {
  tasks: Task[];
  today: string;
};

function countdown(dueDate: string, today: string): string {
  const due = new Date(`${dueDate}T12:00:00`);
  const now = new Date(`${today}T12:00:00`);
  const days = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function BigStuffStrip({ tasks, today }: BigStuffStripProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="big-stuff-strip" aria-label="Big stuff due soon">
      <h2>BIG STUFF</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.title}</span>
            <small>{countdown(task.dueDate!, today)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

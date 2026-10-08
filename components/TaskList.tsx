"use client";

import type { ClassTag, Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

type TaskListProps = {
  title: string;
  tasks: Task[];
  classes: ClassTag[];
  emptyText: string;
  summary?: string;
  today: string;
  onUpdate: (id: string, update: Partial<Task>) => void;
  onPush: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskList({
  title,
  tasks,
  classes,
  emptyText,
  summary,
  today,
  onUpdate,
  onPush,
  onDelete,
}: TaskListProps) {
  return (
    <section className="task-section">
      {title && (
        <div className="section-heading">
          <h2>{title}</h2>
          {summary && <span>{summary}</span>}
        </div>
      )}
      {tasks.length ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                classTag={classes.find((item) => item.id === task.classId) ?? null}
                classes={classes}
                today={today}
                onUpdate={onUpdate}
                onPush={onPush}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">{emptyText}</p>
      )}
    </section>
  );
}

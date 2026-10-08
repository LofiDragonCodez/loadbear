"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { parseQuickAdd } from "@/lib/parse";
import type { ClassTag, Task } from "@/lib/types";

type TaskRowProps = {
  task: Task;
  classTag: ClassTag | null;
  classes: ClassTag[];
  today: string;
  onUpdate: (id: string, update: Partial<Task>) => void;
  onPush: (task: Task) => void;
  onDelete: (task: Task) => void;
};

function compactDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const minutesLeft = minutes % 60;
  return minutesLeft ? `${hours}h${minutesLeft}m` : `${hours}h`;
}

function dueLabel(task: Task, today: string): string {
  if (!task.dueDate) return "Later";
  if (task.dueDate < today) {
    const createdDate = task.createdAt.slice(0, 10);
    return createdDate > task.dueDate ? "past due" : "carried over";
  }
  if (task.dueDate === today) return "today";
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(
    new Date(`${task.dueDate}T12:00:00`),
  );
}

export function TaskRow({
  task,
  classTag,
  classes,
  today,
  onUpdate,
  onPush,
  onDelete,
}: TaskRowProps) {
  const [editing, setEditing] = useState<"title" | "date" | "duration" | null>(null);
  const [editValue, setEditValue] = useState("");
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  function startEdit(field: "title" | "date" | "duration") {
    setEditing(field);
    setEditValue(
      field === "title"
        ? task.title
        : field === "date"
          ? task.dueDate ?? ""
          : compactDuration(task.durationMin),
    );
  }

  function saveEdit() {
    if (!editing) return;
    if (editing === "title") {
      const title = editValue.trim();
      if (title) onUpdate(task.id, { title });
    } else if (editing === "date") {
      const dueDate = editValue.trim()
        ? parseQuickAdd(`task ${editValue}`, new Date(), 30).dueDate
        : null;
      onUpdate(task.id, { dueDate });
    } else {
      const duration = parseQuickAdd(`task ${editValue}`, new Date(), 0);
      if (duration.hasDuration && duration.durationMin > 0) {
        onUpdate(task.id, { durationMin: duration.durationMin });
      }
    }
    setEditing(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit();
    }
    if (event.key === "Escape") {
      setEditing(null);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (
      start &&
      start.x - event.clientX > 64 &&
      Math.abs(start.y - event.clientY) < 40
    ) {
      onPush(task);
    }
  }

  return (
    <div
      className={`task-row ${task.done ? "task-done" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <button
        className="task-check"
        aria-label={task.done ? `Mark ${task.title} unfinished` : `Complete ${task.title}`}
        aria-pressed={task.done}
        onClick={() => onUpdate(task.id, { done: !task.done })}
      >
        {task.done && <span aria-hidden="true">✓</span>}
      </button>

      <div className="task-main">
        {editing === "title" ? (
          <input
            className="inline-edit title-edit"
            aria-label="Edit task title"
            autoFocus
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button
            className="task-title"
            title={task.title}
            onClick={() => startEdit("title")}
          >
            {task.title}
          </button>
        )}
        {editing === "date" ? (
          <input
            className="inline-edit metadata-edit"
            aria-label="Edit due date"
            autoFocus
            placeholder="e.g. fri"
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <button
            className={`task-due ${task.dueDate && task.dueDate < today && !task.done ? "neutral-label" : ""}`}
            onClick={() => startEdit("date")}
            aria-label={`Edit due date, currently ${dueLabel(task, today)}`}
          >
            {dueLabel(task, today)}
          </button>
        )}
      </div>

      <div className="task-meta">
        <label className={`task-category-picker ${classTag ? "" : "no-category"}`}>
          <span
            className="task-category-dot"
            style={{ backgroundColor: classTag?.color ?? "transparent" }}
            aria-hidden="true"
          />
          <span className="sr-only">Category for {task.title}</span>
          <select
            className={classTag ? "has-category" : ""}
            value={task.classId ?? ""}
            onChange={(event) =>
              onUpdate(task.id, { classId: event.target.value || null })
            }
          >
            <option value="">Add tag</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {editing === "duration" ? (
          <input
            className="inline-edit duration-edit"
            aria-label="Edit duration"
            autoFocus
            placeholder="30m"
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <button
            className="task-duration"
            onClick={() => startEdit("duration")}
            aria-label={`Edit duration, currently ${compactDuration(task.durationMin)}`}
          >
            {compactDuration(task.durationMin)}
          </button>
        )}
      </div>

      {!task.done && (
        <button
          className="push-button"
          onClick={() => onPush(task)}
          aria-label={`Push ${task.title} to tomorrow`}
        >
          +1d
        </button>
      )}
      <button
        className="delete-task-button"
        type="button"
        aria-label={`Delete ${task.title}`}
        title={`Delete ${task.title}`}
        onClick={() => onDelete(task)}
      >
        ×
      </button>
    </div>
  );
}

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { parseQuickAdd } from "@/lib/parse";

type QuickAddProps = {
  defaultDurationMin: number;
  referenceDate: Date;
  onAdd: (task: ReturnType<typeof parseQuickAdd>) => void;
};

function formatDate(date: string | null): string {
  if (!date) return "Later";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function QuickAdd({ defaultDurationMin, referenceDate, onAdd }: QuickAddProps) {
  const [value, setValue] = useState("");
  const preview = useMemo(
    () => parseQuickAdd(value, referenceDate, defaultDurationMin),
    [defaultDurationMin, referenceDate, value],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview.title) return;
    onAdd(preview);
    setValue("");
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <label className="sr-only" htmlFor="quick-add-input">Add a task</label>
      <div className="quick-add-control">
        <input
          id="quick-add-input"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Add anything. Just type..."
        />
        <button type="submit" aria-label="Add task" disabled={!preview.title}>
          <span aria-hidden="true">+</span>
        </button>
      </div>
      {value.trim() && (
        <p className="quick-add-preview" aria-live="polite">
          <span className="preview-title">{preview.title || "Add a task name"}</span>
          {preview.title && (
            <>
              <span>·</span>
              <span>{formatDate(preview.dueDate)}</span>
              <span>·</span>
              <span>{formatDuration(preview.durationMin)}</span>
              {preview.className && (
                <>
                  <span>·</span>
                  <span>#{preview.className}</span>
                </>
              )}
              {preview.isBig && <span className="preview-big">BIG STUFF</span>}
            </>
          )}
        </p>
      )}
    </form>
  );
}

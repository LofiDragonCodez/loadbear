"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";
import { BearLogo } from "@/components/BearLogo";
import { BigStuffStrip } from "@/components/BigStuffStrip";
import { QuickAdd } from "@/components/QuickAdd";
import { SuggestionCard } from "@/components/SuggestionCard";
import { TaskList } from "@/components/TaskList";
import { WeekBear } from "@/components/WeekBear";
import { getLoadSuggestions, type LoadSuggestion } from "@/lib/load";
import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/types";

function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function subscribeToLocalDay(notify: () => void): () => void {
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timer = window.setTimeout(notify, nextDay.getTime() - now.getTime());
  return () => window.clearTimeout(timer);
}

function getTodaySnapshot(): string {
  return localDate(new Date());
}

function addDays(date: Date, days: number): string {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return localDate(next);
}

function createId(): string {
  return crypto.randomUUID();
}

function taskOrder(left: Task, right: Task): number {
  if (!left.dueDate) return right.dueDate ? 1 : left.title.localeCompare(right.title);
  if (!right.dueDate) return -1;
  return left.dueDate.localeCompare(right.dueDate);
}

export default function Home() {
  const { state, dispatch } = useAppStore();
  const [filterClassId, setFilterClassId] = useState<string | null>(null);
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [undoEntry, setUndoEntry] = useState<{ message: string; tasks: Task[] } | null>(null);
  const today = useSyncExternalStore(subscribeToLocalDay, getTodaySnapshot, () => "");
  const { weekStartDate, weekEnd } = useMemo(() => {
    if (!today) return { weekStartDate: "", weekEnd: "" };
    const date = new Date(`${today}T12:00:00`);
    const offset = (date.getDay() - state.data.settings.weekStart + 7) % 7;
    date.setDate(date.getDate() - offset);
    const start = localDate(date);
    date.setDate(date.getDate() + 6);
    return { weekStartDate: start, weekEnd: localDate(date) };
  }, [state.data.settings.weekStart, today]);

  const activeTasks = state.data.tasks.filter((task) => !task.done);
  const visibleTasks = filterClassId
    ? activeTasks.filter((task) => task.classId === filterClassId)
    : activeTasks;
  const todayTasks = visibleTasks
    .filter((task) => task.dueDate !== null && task.dueDate <= today)
    .sort(taskOrder);
  const weekTasks = visibleTasks
    .filter((task) => task.dueDate !== null && task.dueDate > today && task.dueDate <= weekEnd)
    .sort(taskOrder);
  const thisWeekAssignmentCount = activeTasks.filter(
    (task) => task.dueDate !== null && task.dueDate >= weekStartDate && task.dueDate <= weekEnd,
  ).length;
  const laterTasks = visibleTasks
    .filter((task) => task.dueDate === null || task.dueDate > weekEnd)
    .sort(taskOrder);
  const doneTasks = state.data.tasks.filter((task) => task.done).sort(taskOrder);
  const bigTasks = activeTasks
    .filter(
      (task) =>
        task.isBig &&
        task.parentId === null &&
        task.dueDate !== null &&
        task.dueDate >= today &&
        task.dueDate <= addDays(new Date(`${today}T12:00:00`), 7),
    )
    .sort(taskOrder);
  const suggestions = getLoadSuggestions(
    activeTasks,
    today,
    weekEnd,
    state.data.settings.mediumMax,
  );

  useEffect(() => {
    if (!undoEntry) return;
    const timeout = window.setTimeout(() => setUndoEntry(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [undoEntry]);

  function addTask(parsed: {
    title: string;
    dueDate: string | null;
    durationMin: number;
    className: string | null;
    isBig: boolean;
  }) {
    setUndoEntry(null);
    const normalizedClass = parsed.className?.toLocaleLowerCase() ?? null;
    dispatch({
      type: "update",
      update: (data) => {
        const existingClass = normalizedClass
          ? data.classes.find((item) => item.name.toLocaleLowerCase() === normalizedClass)
          : undefined;
        const classId =
          existingClass?.id ??
          (normalizedClass ? createId() : null);
        const classes =
          normalizedClass && !existingClass
            ? [
                ...data.classes,
                {
                  id: classId!,
                  name: parsed.className!,
                  color: ["#2664eb", "#13a274", "#ef5847", "#8d5ee8"][
                    data.classes.length % 4
                  ],
                },
              ]
            : data.classes;
        const task: Task = {
          id: createId(),
          title: parsed.title,
          dueDate: parsed.dueDate,
          durationMin: parsed.durationMin,
          classId,
          isBig: parsed.isBig,
          done: false,
          doneAt: null,
          parentId: null,
          createdAt: new Date().toISOString(),
        };
        return { ...data, classes, tasks: [...data.tasks, task] };
      },
    });
  }

  function updateTask(id: string, update: Partial<Task>) {
    const currentTask = state.data.tasks.find((task) => task.id === id);
    if (
      currentTask &&
      typeof update.done === "boolean" &&
      update.done !== currentTask.done
    ) {
      setUndoEntry({
        message: update.done ? "Task completed" : "Task marked active",
        tasks: state.data.tasks,
      });
    } else {
      setUndoEntry(null);
    }
    dispatch({
      type: "update",
      update: (data) => ({
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...update,
                ...(update.done === true ? { doneAt: new Date().toISOString() } : {}),
                ...(update.done === false ? { doneAt: null } : {}),
              }
            : task,
        ),
      }),
    });
  }

  function pushToTomorrow(task: Task) {
    updateTask(task.id, { dueDate: addDays(new Date(`${today}T12:00:00`), 1) });
  }

  function deleteTask(task: Task) {
    setUndoEntry({
      message: task.parentId ? "Work session deleted" : "Task deleted",
      tasks: state.data.tasks,
    });
    dispatch({
      type: "update",
      update: (data) => ({
        ...data,
        tasks: data.tasks.filter(
          (item) => item.id !== task.id && item.parentId !== task.id,
        ),
      }),
    });
  }

  function clearCompletedTasks() {
    if (doneTasks.length === 0) return;
    setUndoEntry({
      message: `${doneTasks.length} completed ${doneTasks.length === 1 ? "task" : "tasks"} cleared`,
      tasks: state.data.tasks,
    });
    dispatch({
      type: "update",
      update: (data) => ({
        ...data,
        tasks: data.tasks.filter((task) => !task.done),
      }),
    });
  }

  function undoLastAction() {
    if (!undoEntry) return;
    const previousTasks = undoEntry.tasks;
    dispatch({
      type: "update",
      update: (data) => ({ ...data, tasks: previousTasks }),
    });
    setUndoEntry(null);
  }

  function acceptSuggestion(suggestion: LoadSuggestion) {
    setUndoEntry({
      message: "Work sessions scheduled",
      tasks: state.data.tasks,
    });
    const sessions = suggestion.sessions.map((session) => ({
      id: createId(),
      title: `Work on ${suggestion.task.title}`,
      dueDate: session.dueDate,
      durationMin: session.durationMin,
      classId: suggestion.task.classId,
      isBig: false,
      done: false,
      doneAt: null,
      parentId: suggestion.task.id,
      createdAt: new Date().toISOString(),
    }));
    dispatch({
      type: "update",
      update: (data) => ({ ...data, tasks: [...data.tasks, ...sessions] }),
    });
  }

  function deleteCategory(categoryId: string, name: string) {
    const confirmed = window.confirm(
      `Delete the "${name}" category? Tasks in this category will remain, but become uncategorized.`,
    );
    if (!confirmed) return;
    setUndoEntry(null);
    dispatch({
      type: "update",
      update: (data) => ({
        ...data,
        classes: data.classes.filter((item) => item.id !== categoryId),
        tasks: data.tasks.map((task) =>
          task.classId === categoryId ? { ...task, classId: null } : task,
        ),
      }),
    });
    setFilterClassId((current) => (current === categoryId ? null : current));
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      setCategoryError("Enter a category name.");
      return;
    }
    if (
      state.data.classes.some(
        (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setCategoryError("That category already exists.");
      return;
    }

    const colors = ["#2664eb", "#13a274", "#ef5847", "#8d5ee8"];
    dispatch({
      type: "update",
      update: (data) => ({
        ...data,
        classes: [
          ...data.classes,
          {
            id: createId(),
            name,
            color: colors[data.classes.length % colors.length],
          },
        ],
      }),
    });
    setCategoryName("");
    setCategoryError("");
    setAddingCategory(false);
  }

  if (!state.loaded || !today) {
    return (
      <main className="planner-shell" aria-label="Loading LOADBEAR">
        <div className="loading-skeleton">
          <div className="skeleton skeleton-wordmark" />
          <div className="skeleton skeleton-input" />
          <div className="skeleton skeleton-strip" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      </main>
    );
  }

  return (
    <main className="planner-shell">
      <header className="brand-header">
        <div className="brand-mark">
          <h1>
            L<BearLogo className="brand-bear" size={47} />ADBEAR
            <span className="brand-period">.</span>
          </h1>
        </div>
        <p>what&apos;s on your mind?</p>
      </header>

      {state.warning && (
        <div className="storage-warning" role="status">
          {state.warning}
        </div>
      )}

      <QuickAdd
        defaultDurationMin={state.data.settings.defaultDurationMin}
        referenceDate={new Date(`${today}T12:00:00`)}
        onAdd={addTask}
      />

      <section className="week-preview" aria-label="This week's load">
        <div className="week-bear-slot">
          <WeekBear assignmentCount={thisWeekAssignmentCount} />
        </div>
        <div className="section-heading week-heading">
          <h2>THIS WEEK&apos;S LOAD</h2>
        </div>
        <div className="week-placeholder">
          {Array.from({ length: 7 }, (_, index) => {
            const dayDate = addDays(new Date(`${weekStartDate}T12:00:00`), index);
            const day = new Intl.DateTimeFormat("en", { weekday: "short" })
              .format(new Date(`${dayDate}T12:00:00`))
              .toUpperCase();
            const dayTasks = activeTasks.filter((task) => task.dueDate === dayDate);
            const minutes = dayTasks
              .reduce((total, task) => total + task.durationMin, 0);
            const dotSpacing = Math.max(3.5, 13 - dayTasks.length * 2);
            const loadLevel =
              minutes <= state.data.settings.lightMax
                ? "light"
                : minutes <= state.data.settings.mediumMax
                  ? "medium"
                  : "overloaded";
            return (
              <div className={`week-day load-${loadLevel} ${dayDate === today ? "today-day" : ""}`} key={dayDate}>
                <time dateTime={dayDate} className="week-date">
                  {`${dayDate.slice(5, 7)}/${dayDate.slice(8, 10)}`}
                </time>
                <div
                  className="week-dots"
                  style={{ "--dot-spacing": `${dotSpacing}px` } as CSSProperties}
                  aria-label={`${dayTasks.length} ${dayTasks.length === 1 ? "assignment" : "assignments"}, ${minutes} minutes, ${loadLevel} load`}
                />
                <strong aria-current={dayDate === today ? "date" : undefined}>
                  {day}
                </strong>
                <small>{minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`}</small>
              </div>
            );
          })}
        </div>
      </section>

      <nav className="planner-nav" aria-label="Planner settings">
        <Link href="/settings">Settings</Link>
      </nav>

      <div className="class-filters" aria-label="Filter by class">
        <button
          className={`class-filter ${filterClassId === null ? "selected" : ""}`}
          onClick={() => setFilterClassId(null)}
        >
          All
        </button>
        {state.data.classes.map((classTag) => (
          <div
            className={`category-filter-item ${filterClassId === classTag.id ? "selected" : ""}`}
            key={classTag.id}
          >
            <button
              className={`class-filter ${filterClassId === classTag.id ? "selected" : ""}`}
              onClick={() =>
                setFilterClassId((current) =>
                  current === classTag.id ? null : classTag.id,
                )
              }
            >
              <span className="class-dot" style={{ backgroundColor: classTag.color }} />
              {classTag.name}
            </button>
            <button
              className="category-delete"
              aria-label={`Delete ${classTag.name} category`}
              title={`Delete ${classTag.name} category`}
              onClick={() => deleteCategory(classTag.id, classTag.name)}
            >
              ×
            </button>
          </div>
        ))}
        {addingCategory ? (
          <form className="category-create" onSubmit={addCategory}>
            <label className="sr-only" htmlFor="new-category-name">
              New category name
            </label>
            <input
              id="new-category-name"
              autoFocus
              maxLength={24}
              value={categoryName}
              aria-invalid={Boolean(categoryError)}
              aria-describedby={categoryError ? "category-error" : undefined}
              placeholder="Category name"
              onChange={(event) => {
                setCategoryName(event.target.value);
                setCategoryError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setAddingCategory(false);
                  setCategoryError("");
                }
              }}
            />
            <button type="submit" aria-label="Save category">Add</button>
            <button
              type="button"
              className="category-cancel"
              aria-label="Cancel adding category"
              onClick={() => {
                setAddingCategory(false);
                setCategoryError("");
              }}
            >
              ×
            </button>
            {categoryError && (
              <span className="category-error" id="category-error" role="alert">
                {categoryError}
              </span>
            )}
          </form>
        ) : (
          <button
            className="class-filter category-add"
            onClick={() => setAddingCategory(true)}
          >
            <span aria-hidden="true">+</span>
            Add category
          </button>
        )}
      </div>

      <BigStuffStrip tasks={bigTasks} today={today} />
      <SuggestionCard suggestions={suggestions} onAccept={acceptSuggestion} />

      <div className="task-sections">
        <TaskList
          title="TODAY"
          tasks={todayTasks}
          classes={state.data.classes}
          emptyText="Nothing on your back today."
          summary={`${todayTasks.length} ${todayTasks.length === 1 ? "task" : "tasks"} · ${Math.floor(todayTasks.reduce((sum, task) => sum + task.durationMin, 0) / 60)}h${todayTasks.reduce((sum, task) => sum + task.durationMin, 0) % 60 ? `${todayTasks.reduce((sum, task) => sum + task.durationMin, 0) % 60}m` : ""}`}
          today={today}
          onUpdate={updateTask}
          onPush={pushToTomorrow}
          onDelete={deleteTask}
        />
        <TaskList
          title="THIS WEEK"
          tasks={weekTasks}
          classes={state.data.classes}
          emptyText="Your week is looking clear."
          summary={`${weekTasks.length} ${weekTasks.length === 1 ? "task" : "tasks"}`}
          today={today}
          onUpdate={updateTask}
          onPush={pushToTomorrow}
          onDelete={deleteTask}
        />
        <TaskList
          title="LATER"
          tasks={laterTasks}
          classes={state.data.classes}
          emptyText="Drop anything here for later."
          summary={`${laterTasks.length} ${laterTasks.length === 1 ? "task" : "tasks"}`}
          today={today}
          onUpdate={updateTask}
          onPush={pushToTomorrow}
          onDelete={deleteTask}
        />
      </div>

      <section className="done-section">
        <div className="done-header">
          <button
            className="done-toggle"
            aria-expanded={doneExpanded}
            onClick={() => setDoneExpanded((expanded) => !expanded)}
          >
            <span>DONE</span>
            <span>{doneTasks.length} {doneExpanded ? "−" : "+"}</span>
          </button>
          {doneTasks.length > 0 && (
            <button className="clear-done" onClick={clearCompletedTasks}>
              Clear completed
            </button>
          )}
        </div>
        {doneExpanded && (
          <TaskList
            title=""
            tasks={doneTasks}
            classes={state.data.classes}
            emptyText="Completed tasks will rest here."
            today={today}
            onUpdate={updateTask}
            onPush={pushToTomorrow}
            onDelete={deleteTask}
          />
        )}
      </section>

      {undoEntry && (
        <div className="undo-toast" role="status" aria-live="polite">
          <span>{undoEntry.message}</span>
          <button type="button" onClick={undoLastAction}>Undo</button>
        </div>
      )}

      <footer className="planner-footer">
        <span>LOADBEAR</span>
        <span className="footer-credit">made with &lt;3 by Aarya Rajkumar</span>
      </footer>
    </main>
  );
}

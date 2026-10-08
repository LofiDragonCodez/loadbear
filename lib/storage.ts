import {
  createDefaultAppData,
  type AppData,
  type ClassTag,
  type Settings,
  type Task,
} from "./types";

const STORAGE_KEY = "loadbear.data";
const CORRUPT_KEY_PREFIX = "loadbear.corrupt.";
let memoryData: AppData | null = null;

export type StorageLoadResult = {
  data: AppData;
  warning: string | null;
  persistenceBlocked: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    (typeof value.dueDate === "string" || value.dueDate === null) &&
    typeof value.durationMin === "number" &&
    (typeof value.classId === "string" || value.classId === null) &&
    typeof value.isBig === "boolean" &&
    typeof value.done === "boolean" &&
    (typeof value.doneAt === "string" || value.doneAt === null) &&
    (typeof value.parentId === "string" || value.parentId === null) &&
    typeof value.createdAt === "string"
  );
}

function isClassTag(value: unknown): value is ClassTag {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.color === "string"
  );
}

function isSettings(value: unknown): value is Settings {
  return (
    isRecord(value) &&
    typeof value.lightMax === "number" &&
    typeof value.mediumMax === "number" &&
    typeof value.defaultDurationMin === "number" &&
    (value.weekStart === 0 || value.weekStart === 1)
  );
}

export function migrate(value: unknown): AppData {
  if (!isRecord(value) || typeof value.version !== "number") {
    throw new Error("Stored data has no valid schema version.");
  }
  if (value.version > 1) {
    throw new Error("This LOADBEAR data was created by a newer version.");
  }
  if (
    value.version !== 1 ||
    !Array.isArray(value.tasks) ||
    !value.tasks.every(isTask) ||
    !Array.isArray(value.classes) ||
    !value.classes.every(isClassTag) ||
    !isSettings(value.settings)
  ) {
    throw new Error("Stored data does not match the LOADBEAR schema.");
  }

  return {
    version: 1,
    tasks: value.tasks,
    classes: value.classes,
    settings: value.settings,
  };
}

export function loadAppData(): StorageLoadResult {
  if (memoryData) {
    return { data: memoryData, warning: null, persistenceBlocked: false };
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    const data = createDefaultAppData();
    memoryData = data;
    return {
      data,
      warning: "Browser storage is unavailable. Your changes will stay in memory for this session.",
      persistenceBlocked: true,
    };
  }

  if (raw === null) {
    const data = createDefaultAppData();
    memoryData = data;
    return { data, warning: null, persistenceBlocked: false };
  }

  try {
    const data = migrate(JSON.parse(raw) as unknown);
    memoryData = data;
    return { data, warning: null, persistenceBlocked: false };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "This LOADBEAR data was created by a newer version."
    ) {
      return {
        data: createDefaultAppData(),
        warning: "Your saved data is from a newer LOADBEAR version and was left untouched.",
        persistenceBlocked: true,
      };
    }

    try {
      window.localStorage.setItem(
        `${CORRUPT_KEY_PREFIX}${Date.now()}`,
        raw,
      );
    } catch {
      // Keep the in-memory reset available even if the backup cannot be written.
    }
    const data = createDefaultAppData();
    memoryData = data;
    return {
      data,
      warning: "Saved data was damaged, so a backup was made and a fresh planner was started.",
      persistenceBlocked: false,
    };
  }
}

export function saveAppData(data: AppData): string | null {
  memoryData = data;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch {
    return "Browser storage is full or unavailable. Your changes are kept in memory for this session.";
  }
}

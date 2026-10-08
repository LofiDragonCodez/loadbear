export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  durationMin: number;
  classId: string | null;
  isBig: boolean;
  done: boolean;
  doneAt: string | null;
  parentId: string | null;
  createdAt: string;
};

export type ClassTag = {
  id: string;
  name: string;
  color: string;
};

export type Settings = {
  lightMax: number;
  mediumMax: number;
  defaultDurationMin: number;
  weekStart: 0 | 1;
};

export type AppData = {
  version: 1;
  tasks: Task[];
  classes: ClassTag[];
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  lightMax: 90,
  mediumMax: 180,
  defaultDurationMin: 30,
  weekStart: 1,
};

export function createDefaultAppData(): AppData {
  return {
    version: 1,
    tasks: [],
    classes: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

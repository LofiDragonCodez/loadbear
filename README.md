# LOADBEAR

LOADBEAR is a lightweight student planner that makes the workload across your week visible. Add tasks in a single line, see which days are getting heavy, and let the bear help you spread out big assignments.

## Features

- Natural-language task entry with due dates, durations, categories, and big-task flags.
- Today, This Week, Later, and completed task lists.
- Seven-day workload strip with adjustable light and medium thresholds.
- Suggestions for splitting long assignments into linked work sessions.
- Big-task countdowns and undo for task actions.
- Local-only storage, category color editing, and settings for week start and default duration.
- JSON backup download and validated restore.

All planner data is stored in the browser's local storage. There are no accounts or backend services. Download a backup before clearing browser data or switching devices.

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Deploy

LOADBEAR is a Next.js application and can be deployed to Vercel by importing this repository and using the default Next.js build settings.

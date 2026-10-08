"use client";

import Link from "next/link";
import { BackupRestore } from "@/components/BackupRestore";
import { SettingsForm } from "@/components/SettingsForm";
import { useAppStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const { state, dispatch } = useAppStore();

  function saveSettings(settings: Settings) {
    dispatch({
      type: "update",
      update: (data) => ({ ...data, settings }),
    });
  }

  function updateClassColor(classId: string, color: string) {
    dispatch({
      type: "update",
      update: (data) => ({
        ...data,
        classes: data.classes.map((classTag) =>
          classTag.id === classId ? { ...classTag, color } : classTag,
        ),
      }),
    });
  }

  function restoreBackup(data: typeof state.data) {
    dispatch({
      type: "update",
      update: () => data,
    });
  }

  if (!state.loaded) {
    return (
      <main className="planner-shell" aria-label="Loading settings">
        <div className="loading-skeleton">
          <div className="skeleton skeleton-wordmark" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      </main>
    );
  }

  return (
    <main className="planner-shell settings-page">
      <header className="settings-header">
        <Link className="settings-back" href="/">← Back to planner</Link>
        <span className="settings-kicker">PLANNER PREFERENCES</span>
        <h1>
          Make LOADBEAR
          <br />
          <span>work your way.</span>
        </h1>
        <p>Small tweaks to make your week feel a little lighter.</p>
      </header>
      {state.warning && (
        <div className="storage-warning" role="status">
          {state.warning}
        </div>
      )}
      <SettingsForm
        key={`${state.data.settings.lightMax}-${state.data.settings.mediumMax}-${state.data.settings.defaultDurationMin}-${state.data.settings.weekStart}`}
        settings={state.data.settings}
        classes={state.data.classes}
        onSave={saveSettings}
        onColorChange={updateClassColor}
      />
      <BackupRestore data={state.data} onRestore={restoreBackup} />
      <footer className="planner-footer">
        <span>LOADBEAR</span>
        <span className="footer-credit">made with &lt;3 by Aarya Rajkumar</span>
      </footer>
    </main>
  );
}

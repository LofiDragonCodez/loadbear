"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { migrate } from "@/lib/storage";
import type { AppData } from "@/lib/types";

type BackupRestoreProps = {
  data: AppData;
  onRestore: (data: AppData) => void;
};

function localDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function BackupRestore({ data, onRestore }: BackupRestoreProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function exportBackup() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `loadbear-backup-${localDateString(new Date())}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
      setMessage("Backup downloaded.");
    } catch (cause) {
      setMessage("");
      setError(
        cause instanceof Error
          ? `Could not download backup: ${cause.message}`
          : "Could not download backup.",
      );
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("That file is too large. Choose a backup smaller than 5 MB.");
      }
      const restored = migrate(JSON.parse(await file.text()) as unknown);
      const confirmed = window.confirm(
        `Restore ${restored.tasks.length} tasks and ${restored.classes.length} categories? This replaces the planner data on this device.`,
      );
      if (!confirmed) return;
      onRestore(restored);
      setMessage("Backup restored.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `Could not restore backup: ${cause.message}`
          : "Could not restore backup because the file could not be read.",
      );
    } finally {
      input.value = "";
    }
  }

  return (
    <section className="settings-group backup-card" aria-labelledby="backup-heading">
      <div className="backup-heading">
        <div>
          <span className="settings-kicker">YOUR DATA</span>
          <h2 id="backup-heading">Backup &amp; restore</h2>
        </div>
        <span className="backup-file-mark" aria-hidden="true">JSON</span>
      </div>
      <p>
        Keep a copy of your tasks and preferences, or restore them on another
        device. Restoring replaces the data currently saved in this browser.
      </p>
      <div className="backup-actions">
        <button type="button" className="settings-save" onClick={exportBackup}>
          Download backup
        </button>
        <button
          type="button"
          className="backup-restore-button"
          onClick={() => fileInput.current?.click()}
        >
          Restore from file
        </button>
        <input
          ref={fileInput}
          className="sr-only"
          type="file"
          accept=".json,application/json"
          onChange={importBackup}
          aria-label="Choose a LOADBEAR JSON backup"
        />
      </div>
      {error && <p className="settings-error" role="alert">{error}</p>}
      {message && <p className="settings-saved" role="status">{message}</p>}
    </section>
  );
}

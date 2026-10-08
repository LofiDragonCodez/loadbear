"use client";

import { useState, type FormEvent } from "react";
import type { ClassTag, Settings } from "@/lib/types";

type SettingsFormProps = {
  settings: Settings;
  classes: ClassTag[];
  onSave: (settings: Settings) => void;
  onColorChange: (classId: string, color: string) => void;
};

export function SettingsForm({
  settings,
  classes,
  onSave,
  onColorChange,
}: SettingsFormProps) {
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateNumber(field: "lightMax" | "mediumMax" | "defaultDurationMin", value: string) {
    setDraft((current) => ({ ...current, [field]: Number(value) }));
    setError("");
    setSaved(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !Number.isInteger(draft.lightMax) ||
      !Number.isInteger(draft.mediumMax) ||
      !Number.isInteger(draft.defaultDurationMin) ||
      draft.lightMax < 1 ||
      draft.mediumMax <= draft.lightMax ||
      draft.defaultDurationMin < 1
    ) {
      setError("Use whole minutes, and make the overloaded threshold higher than the light threshold.");
      setSaved(false);
      return;
    }
    onSave(draft);
    setSaved(true);
    setError("");
  }

  return (
    <div className="settings-content">
      <form className="settings-form" onSubmit={submit}>
        <fieldset className="settings-group">
          <legend>Workload thresholds</legend>
          <p>Set the minute limits used to label each day’s workload.</p>
          <div className="settings-load-key" aria-label="Workload levels">
            <span><i className="load-key-light" />Light</span>
            <span><i className="load-key-medium" />Medium</span>
            <span><i className="load-key-heavy" />Overloaded</span>
          </div>
          <label className="settings-field">
            <span>Light day, up to</span>
            <span className="settings-number">
              <input
                type="number"
                min="1"
                max="1440"
                step="1"
                value={draft.lightMax}
                onChange={(event) => updateNumber("lightMax", event.target.value)}
                aria-label="Light workload maximum minutes"
              />
              <span>minutes</span>
            </span>
          </label>
          <label className="settings-field">
            <span>Medium day, up to</span>
            <span className="settings-number">
              <input
                type="number"
                min="1"
                max="2880"
                step="1"
                value={draft.mediumMax}
                onChange={(event) => updateNumber("mediumMax", event.target.value)}
                aria-label="Medium workload maximum minutes"
              />
              <span>minutes</span>
            </span>
          </label>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Quick add</legend>
          <p>Used when a task doesn’t include a duration.</p>
          <label className="settings-field">
            <span>Default task duration</span>
            <span className="settings-number">
              <input
                type="number"
                min="1"
                max="480"
                step="1"
                value={draft.defaultDurationMin}
                onChange={(event) =>
                  updateNumber("defaultDurationMin", event.target.value)
                }
                aria-label="Default task duration minutes"
              />
              <span>minutes</span>
            </span>
          </label>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Calendar</legend>
          <label className="settings-field">
            <span>Week starts on</span>
            <select
              value={draft.weekStart}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  weekStart: event.target.value === "0" ? 0 : 1,
                }));
                setError("");
                setSaved(false);
              }}
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
            </select>
          </label>
        </fieldset>

        {error && <p className="settings-error" role="alert">{error}</p>}
        {saved && <p className="settings-saved" role="status">Settings saved.</p>}
        <button className="settings-save" type="submit">Save settings</button>
      </form>

      <section className="settings-group settings-colors">
        <h2>Category colors</h2>
        <p>Choose a color for each category. Changes save as you pick.</p>
        {classes.length ? (
          <ul>
            {classes.map((classTag) => (
              <li key={classTag.id}>
                <label htmlFor={`color-${classTag.id}`}>{classTag.name}</label>
                <input
                  id={`color-${classTag.id}`}
                  type="color"
                  value={classTag.color}
                  onChange={(event) => onColorChange(classTag.id, event.target.value)}
                  aria-label={`Color for ${classTag.name}`}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="settings-empty">Add a category in your planner to customize its color.</p>
        )}
      </section>
    </div>
  );
}

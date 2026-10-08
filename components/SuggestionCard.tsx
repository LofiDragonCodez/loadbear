"use client";

import type { LoadSuggestion } from "@/lib/load";

type SuggestionCardProps = {
  suggestions: LoadSuggestion[];
  onAccept: (suggestion: LoadSuggestion) => void;
};

function weekday(date: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "long" }).format(
    new Date(`${date}T12:00:00`),
  );
}

export function SuggestionCard({ suggestions, onAccept }: SuggestionCardProps) {
  if (suggestions.length === 0) return null;

  return (
    <section className="suggestion-list" aria-label="Workload suggestions">
      {suggestions.map((suggestion) => {
        const firstSessionDate = suggestion.sessions[0].dueDate;
        const dates = [...new Set(suggestion.sessions.map((session) => session.dueDate))];
        const startDays = dates.map(weekday);
        return (
          <article className="suggestion-card" key={suggestion.overloadedDate}>
            <p>
              {weekday(suggestion.overloadedDate)} is a heavy day for the bear.
              Start <strong>{suggestion.task.title}</strong> on{" "}
              {startDays.length === 1
                ? startDays[0]
                : `${startDays.slice(0, -1).join(", ")} and ${startDays.at(-1)}`}
              .
            </p>
            <button
              type="button"
              onClick={() => onAccept(suggestion)}
              aria-label={`Schedule ${suggestion.sessions.length} work ${suggestion.sessions.length === 1 ? "session" : "sessions"} for ${suggestion.task.title}, starting ${weekday(firstSessionDate)}`}
            >
              Schedule sessions
            </button>
          </article>
        );
      })}
    </section>
  );
}

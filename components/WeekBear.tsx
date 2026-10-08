"use client";

import { useEffect, useRef, useState } from "react";

type WeekBearProps = {
  assignmentCount: number;
};

export function WeekBear({ assignmentCount }: WeekBearProps) {
  const [petted, setPetted] = useState(false);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mood =
    assignmentCount >= 5 ? "overloaded" : assignmentCount >= 2 ? "working" : "happy";
  const description =
    mood === "overloaded"
      ? "The bear is sweating under a heavy week"
      : mood === "working"
        ? "The bear is working through a moderate week"
        : "The bear is sitting happily";

  useEffect(
    () => () => {
      if (petTimer.current) clearTimeout(petTimer.current);
    },
    [],
  );

  function petBear() {
    if (petTimer.current) clearTimeout(petTimer.current);
    setPetted(true);
    petTimer.current = setTimeout(() => setPetted(false), 850);
  }

  return (
    <div className="week-bear-wrap">
      <button
        className={`week-bear week-bear-${mood}${petted ? " week-bear-petted" : ""}`}
        type="button"
        aria-label={`Pet the bear. ${description}`}
        onClick={petBear}
      >
        <svg viewBox="0 0 88 88" aria-hidden="true">
        <ellipse cx="44" cy="80" rx="25" ry="4" fill="#111" opacity=".12" />
        <g className="bear-body">
          <path
            d="M25 53C25 45 31 41 44 41C57 41 63 46 63 59V68C63 74 58 77 52 77H35C28 77 24 73 24 67L25 53Z"
            fill="white"
            stroke="#111"
            strokeWidth="3.5"
          />
          <path
            d="M24 63C18 63 16 67 17 71C18 75 23 76 31 74M63 63C69 63 72 67 70 72C68 76 63 76 56 74"
            fill="white"
            stroke="#111"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M27 21C27 15 32 12 36 17C41 14 48 14 53 17C58 12 64 16 63 23C69 28 70 36 67 43C64 51 56 56 44 56C32 56 24 50 21 42C18 34 21 26 27 21Z"
            fill="white"
            stroke="#111"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="33" r="2.1" fill="#111" />
          <circle cx="56" cy="33" r="2.1" fill="#111" />
          <ellipse cx="44" cy="40" rx="6" ry="4.5" fill="#111" />
          <path d="M44 44V47M44 47C41 50 38 49 36 47M44 47C47 50 50 49 52 47" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          {mood !== "happy" && (
            <>
              <path d="M18 28C15 33 15 36 18 37C21 36 21 33 18 28Z" fill="#111" />
              {mood === "overloaded" && (
                <>
                  <path d="M70 31C67 36 67 39 70 40C73 39 73 36 70 31Z" fill="#111" />
                  <path d="M15 43C12 48 12 51 15 52C18 51 18 48 15 43Z" fill="#111" />
                </>
              )}
            </>
          )}
          {mood === "happy" && (
            <path d="M30 27C31 25 33 25 34 27M54 27C55 25 57 25 58 27" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          )}
        </g>
        {mood === "happy" && (
          <path d="M68 22L70 17L72 22L77 24L72 26L70 31L68 26L63 24L68 22Z" fill="#111" />
        )}
        {petted && (
          <g className="bear-hearts" fill="#d77aa8">
            <path d="M12 23C8 19 3 24 12 31C21 24 16 19 12 23Z" />
            <path d="M75 48C71 44 66 49 75 56C84 49 79 44 75 48Z" />
          </g>
        )}
        </svg>
      </button>
    </div>
  );
}

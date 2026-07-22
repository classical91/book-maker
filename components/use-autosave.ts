"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "unsaved" | "saving" | "error" | "conflict";

// Outcome of a single save attempt.
export type SaveResult = "ok" | "conflict" | "error";

export const SAVE_STATE_LABELS: Record<SaveState, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Save failed",
  conflict: "Changed elsewhere",
};

type Options = {
  /** A string that changes whenever the editable data changes. */
  serialized: string;
  /** Persists the current data. Should read the latest values itself. */
  save: () => Promise<SaveResult>;
  /** Debounce delay in ms after the last change. */
  delay?: number;
  /** When false, autosave is paused (e.g. after an unresolved conflict). */
  enabled?: boolean;
};

/**
 * Debounced autosave with explicit save-state tracking and a beforeunload guard.
 *
 * - Transitions: saved → unsaved → saving → saved | error | conflict.
 * - Saves are serialized through a promise queue, so a change made mid-save is
 *   picked up by a following save rather than overlapping it.
 * - Warns the user before leaving the page while changes are unsaved.
 */
export function useAutosave({ serialized, save, delay = 2000, enabled = true }: Options) {
  const [state, setState] = useState<SaveState>("saved");

  const baseline = useRef(serialized); // last successfully saved value
  const latest = useRef(serialized); // most recent value seen
  const saveRef = useRef(save);
  const stateRef = useRef(state);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync after each render (never write refs during render).
  useEffect(() => {
    latest.current = serialized;
    saveRef.current = save;
    stateRef.current = state;
  });

  // Stable: reads everything from refs, so it never needs to be recreated.
  const runSave = useCallback(() => {
    queue.current = queue.current.then(async () => {
      if (latest.current === baseline.current) return;
      const target = latest.current;
      setState("saving");

      let result: SaveResult;
      try {
        result = await saveRef.current();
      } catch {
        result = "error";
      }

      if (result === "ok") {
        baseline.current = target;
        setState(latest.current === baseline.current ? "saved" : "unsaved");
      } else {
        setState(result === "conflict" ? "conflict" : "error");
      }
    });
    return queue.current;
  }, []);

  // Debounced autosave whenever the data changes.
  useEffect(() => {
    if (!enabled) return;
    if (serialized === baseline.current) return;
    if (stateRef.current !== "conflict") setState("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void runSave();
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [serialized, enabled, delay, runSave]);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (latest.current !== baseline.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  /** Force an immediate save (e.g. an explicit Save button). */
  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    return runSave();
  }, [runSave]);

  /** Mark a value as the saved baseline (e.g. after a restore/reload). */
  const markSaved = useCallback((value: string) => {
    baseline.current = value;
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    setState("saved");
  }, []);

  return { state, saveNow, markSaved };
}

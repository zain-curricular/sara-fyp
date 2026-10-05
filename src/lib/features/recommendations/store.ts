// ============================================================================
// Recommendations Feature — Behaviour Event Store
// ============================================================================
//
// Browser-only event log backing the live recommendation engine. Works for
// guests (no auth needed) and survives reloads via localStorage.
//
// Reactivity
// ----------
// A tiny external store: `recordBehaviourEvent` appends, persists, and
// notifies subscribers synchronously, so every mounted rail and the taste
// panel re-render in the same frame. The `storage` event keeps other tabs in
// sync. Consumed through `useSyncExternalStore` in `hooks.ts`.
//
// Storage can throw (private mode, blocked site data) — every access is
// wrapped so the engine degrades to in-memory for the session.

import { EVENTS_STORAGE_KEY, MAX_EVENTS } from "./config";
import type { BehaviourEvent } from "./types";

/** A behaviour event without its timestamp — the store stamps `at` itself. */
export type BehaviourEventInput = BehaviourEvent extends infer E ? (E extends unknown ? Omit<E, "at"> : never) : never;

const EMPTY: BehaviourEvent[] = [];

let events: BehaviourEvent[] | null = null;
const listeners = new Set<() => void>();

// -- Persistence ---------------------------------------------------------------------

function readFromStorage(): BehaviourEvent[] {
	try {
		const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? (parsed as BehaviourEvent[]).slice(-MAX_EVENTS) : [];
	} catch {
		return [];
	}
}

function writeToStorage(next: BehaviourEvent[]) {
	try {
		window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(next));
	} catch {
		// In-memory only for this session.
	}
}

function notify() {
	for (const listener of listeners) listener();
}

// -- Public API ----------------------------------------------------------------------

/** Current event log (stable reference between changes). */
export function getBehaviourEvents(): BehaviourEvent[] {
	if (typeof window === "undefined") return EMPTY;
	if (events === null) events = readFromStorage();
	return events;
}

/** Server snapshot for `useSyncExternalStore` — always empty. */
export function getServerBehaviourEvents(): BehaviourEvent[] {
	return EMPTY;
}

/** Subscribes to log changes (this tab + other tabs). Returns an unsubscribe fn. */
export function subscribeToBehaviourEvents(listener: () => void): () => void {
	listeners.add(listener);

	const onStorage = (event: StorageEvent) => {
		if (event.key !== EVENTS_STORAGE_KEY) return;
		events = readFromStorage();
		listener();
	};
	window.addEventListener("storage", onStorage);

	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", onStorage);
	};
}

/**
 * Appends a behaviour event and notifies subscribers immediately.
 *
 * Consecutive duplicates (same listing view, same filter state) are collapsed
 * into a timestamp refresh so React Strict Mode double effects and reloads
 * don't inflate the signal.
 */
export function recordBehaviourEvent(input: BehaviourEventInput) {
	if (typeof window === "undefined") return;

	const current = getBehaviourEvents();
	const event = { ...input, at: Date.now() } as BehaviourEvent;
	const last = current[current.length - 1];

	const isDuplicate =
		last !== undefined &&
		last.type === event.type &&
		JSON.stringify({ ...last, at: 0 }) === JSON.stringify({ ...event, at: 0 });
	const base = isDuplicate ? current.slice(0, -1) : current;

	events = [...base, event].slice(-MAX_EVENTS);
	writeToStorage(events);
	notify();
}

/** Clears the behaviour log (taste panel "Reset"). */
export function clearBehaviourEvents() {
	if (typeof window === "undefined") return;

	events = [];
	try {
		window.localStorage.removeItem(EVENTS_STORAGE_KEY);
	} catch {
		// Nothing persisted.
	}
	notify();
}

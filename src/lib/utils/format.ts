// ============================================================================
// Display Formatting — numbers & dates (hydration-safe)
// ============================================================================
//
// Every number and date shown in the UI goes through these helpers so the
// server render and the browser render produce IDENTICAL text.
//
// Why
// ---
// `n.toLocaleString()` / `toLocaleDateString(undefined, …)` use the runtime's
// default locale AND time zone. The server (Vercel, UTC, en-US) and a shopper's
// browser (Asia/Karachi, any locale) disagree — e.g. an order placed at 21:00
// UTC is "Oct 5" on the server but "Oct 6" in Pakistan — and React throws
// hydration error #418 and re-renders the whole tree on the client.
//
// Pinning one locale + the marketplace's time zone makes output deterministic.

/** Locale used for all UI number / date formatting. */
export const DISPLAY_LOCALE = "en-US";

/** Marketplace time zone — dates are shown as they are in Pakistan. */
export const DISPLAY_TIME_ZONE = "Asia/Karachi";

const NUMBER_FORMATTER = new Intl.NumberFormat(DISPLAY_LOCALE);

/** Grouped number, e.g. 12500 → "12,500". Non-finite input renders as "0". */
export function formatNumber(value: number | string | null | undefined): string {
	const n = typeof value === "string" ? Number.parseFloat(value) : Number(value ?? 0);
	return NUMBER_FORMATTER.format(Number.isFinite(n) ? n : 0);
}

function toDate(value: string | number | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

/**
 * Calendar date in the marketplace time zone.
 *
 * @param options - Intl options; defaults to numeric month/day/year ("10/6/2026").
 */
export function formatDate(
	value: string | number | Date,
	options: Intl.DateTimeFormatOptions = { year: "numeric", month: "numeric", day: "numeric" },
): string {
	const date = toDate(value);
	if (Number.isNaN(date.getTime())) return String(value);
	return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
		timeZone: DISPLAY_TIME_ZONE,
		...options,
	}).format(date);
}

/** Date + time in the marketplace time zone, e.g. "Oct 6, 2026, 2:30 AM". */
export function formatDateTime(
	value: string | number | Date,
	options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
	return formatDate(value, options);
}

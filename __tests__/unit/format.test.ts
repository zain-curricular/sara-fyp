// ============================================================================
// Display Formatting — Unit Tests
// ============================================================================
//
// Pins the hydration-safety contract of `src/lib/utils/format.ts`: output
// depends only on the input, never on the runtime's locale or time zone, so
// the Vercel server (UTC) and a browser in Pakistan render identical text.

import { afterEach, describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatNumber } from "@/lib/utils/format";

const ORIGINAL_TZ = process.env.TZ;

describe("formatNumber", () => {

	it("groups thousands with commas", () => {
		expect(formatNumber(12500)).toBe("12,500");
		expect(formatNumber(1550)).toBe("1,550");
		expect(formatNumber(250000)).toBe("250,000");
	});

	it("parses numeric strings and renders non-finite input as 0", () => {
		expect(formatNumber("4550.00")).toBe("4,550");
		expect(formatNumber("abc")).toBe("0");
		expect(formatNumber(null)).toBe("0");
		expect(formatNumber(undefined)).toBe("0");
	});
});

describe("formatDate / formatDateTime", () => {

	afterEach(() => {
		process.env.TZ = ORIGINAL_TZ;
	});

	it("shows the Pakistan calendar date for a late-UTC timestamp", () => {

		// 21:00 UTC on Oct 5 is 02:00 on Oct 6 in Asia/Karachi (UTC+5)
		expect(formatDate("2026-10-05T21:00:00Z")).toBe("10/6/2026");
		expect(formatDate("2026-10-05T21:00:00Z", { dateStyle: "medium" })).toBe("Oct 6, 2026");
	});

	it("does not depend on the runtime time zone", () => {
		process.env.TZ = "UTC";
		const asServer = formatDateTime("2026-10-05T21:30:00Z");
		process.env.TZ = "America/New_York";
		const asOtherHost = formatDateTime("2026-10-05T21:30:00Z");

		expect(asServer).toBe(asOtherHost);
		expect(asServer).toBe("Oct 6, 2026, 2:30 AM");
	});

	it("returns the raw input for invalid dates instead of throwing", () => {
		expect(formatDate("not-a-date")).toBe("not-a-date");
	});
});

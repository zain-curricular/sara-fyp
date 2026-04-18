import { describe, expect, it } from "vitest";

/**
 * Documents the gate used after `await supabase.auth.getSession()` in RecordListingView:
 * if the effect was cleaned up (Strict Mode) before POST, `cancelled` is true and we skip.
 */
function shouldPostView(accessToken: string | undefined, cancelled: boolean): boolean {
	return Boolean(accessToken && !cancelled);
}

describe("RecordListingView post gate", () => {
	it("skips when cancelled is true after session await", () => {
		expect(shouldPostView("jwt", true)).toBe(false);
	});

	it("posts when token exists and effect is still active", () => {
		expect(shouldPostView("jwt", false)).toBe(true);
	});

	it("skips without access token", () => {
		expect(shouldPostView(undefined, false)).toBe(false);
	});
});

import { describe, expect, it } from "vitest";

import { updateOwnProfileSchema } from "./schemas";

describe("updateOwnProfileSchema", () => {
	it("treats empty strings as omitted for optional fields", () => {
		const parsed = updateOwnProfileSchema.safeParse({
			display_name: "",
			phone_number: "",
			handle: "",
			city: "",
			bio: "",
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data).toEqual({});
		}
	});

	it("accepts valid optional fields", () => {
		const parsed = updateOwnProfileSchema.safeParse({
			display_name: "Ada",
			handle: "ada_lovelace",
			phone_number: "+923001234567",
			locale: "en",
		});
		expect(parsed.success).toBe(true);
	});

	it("rejects invalid handle", () => {
		const parsed = updateOwnProfileSchema.safeParse({ handle: "Bad Handle" });
		expect(parsed.success).toBe(false);
	});

	it("rejects invalid E.164 phone", () => {
		const parsed = updateOwnProfileSchema.safeParse({ phone_number: "03001234567" });
		expect(parsed.success).toBe(false);
	});
});

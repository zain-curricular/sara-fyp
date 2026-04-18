import { z } from "zod";

/** Empty string from forms → `undefined` so optional fields validate correctly. */
function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
	return z.preprocess((val) => (val === "" ? undefined : val), z.optional(schema));
}

/** Validated body for PATCH /api/profiles/me — user-editable fields only. */
export const updateOwnProfileSchema = z
	.object({
		display_name: emptyToUndefined(z.string().min(1).max(80)),
		avatar_url: emptyToUndefined(z.string().url()),
		phone_number: emptyToUndefined(z.string().regex(/^\+[1-9]\d{1,14}$/)),
		city: emptyToUndefined(z.string().max(100)),
		area: emptyToUndefined(z.string().max(100)),
		bio: emptyToUndefined(z.string().max(500)),
		handle: emptyToUndefined(z.string().regex(/^[a-z0-9_]{3,30}$/)),
		locale: z.enum(["en", "ur"]).optional(),
	})
	.strict();

export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;

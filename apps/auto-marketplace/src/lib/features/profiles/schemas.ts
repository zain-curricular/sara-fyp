import { z } from "zod";

/** `""` from HTML inputs → `undefined` for optional PATCH fields. */
function emptyOr<T extends z.ZodTypeAny>(inner: T) {
	return z.union([z.literal(""), inner]).transform((v) => (v === "" ? undefined : v));
}

/** Validated body for PATCH /api/profiles/me — user-editable fields only. */
export const updateOwnProfileSchema = z
	.object({
		display_name: emptyOr(z.string().min(1).max(80)).optional(),
		avatar_url: emptyOr(z.string().url()).optional(),
		phone_number: emptyOr(z.string().regex(/^\+[1-9]\d{1,14}$/)).optional(),
		city: emptyOr(z.string().max(100)).optional(),
		area: emptyOr(z.string().max(100)).optional(),
		bio: emptyOr(z.string().max(500)).optional(),
		handle: emptyOr(z.string().regex(/^[a-z0-9_]{3,30}$/)).optional(),
		locale: z.enum(["en", "ur"]).optional(),
	})
	.strict();

export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;

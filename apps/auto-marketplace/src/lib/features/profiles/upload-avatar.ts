"use client";

import { apiFetchFormData } from "@/lib/api/client";

import type { ApiEnvelope } from "./types";

/** Response shape from POST /api/profiles/me/avatar. */
export type AvatarUploadResult = { avatar_url: string };

export async function uploadProfileAvatar(
	accessToken: string | undefined,
	file: File,
): Promise<AvatarUploadResult> {
	if (!accessToken) {
		throw new Error("Not signed in");
	}

	const form = new FormData();
	form.append("file", file);

	const body = await apiFetchFormData<ApiEnvelope<AvatarUploadResult>>(
		"/api/profiles/me/avatar",
		form,
		{
			method: "POST",
			accessToken,
		},
	);

	if (!body.ok || !("data" in body) || !body.data) {
		const msg =
			body && "error" in body && typeof body.error === "string" ? body.error : "Upload failed";
		throw new Error(msg);
	}

	return body.data;
}

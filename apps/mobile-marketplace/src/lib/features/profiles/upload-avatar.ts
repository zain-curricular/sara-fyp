"use client";

import { getMarketplaceApiOrigin } from "@/lib/api/base-url";

import type { ApiEnvelope } from "./types";

/** Response shape from POST /api/profiles/me/avatar. */
export type AvatarUploadResult = { avatar_url: string };

export async function uploadProfileAvatar(
	accessToken: string | undefined,
	file: File,
): Promise<AvatarUploadResult> {
	const origin = getMarketplaceApiOrigin();
	if (!origin) {
		throw new Error("NEXT_PUBLIC_API_URL is not set");
	}
	if (!accessToken) {
		throw new Error("Not signed in");
	}

	const form = new FormData();
	form.append("file", file);

	const res = await fetch(`${origin}/api/profiles/me/avatar`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		body: form,
	});

	const body = (await res.json()) as ApiEnvelope<AvatarUploadResult>;

	if (!res.ok || !body.ok || !("data" in body) || !body.data) {
		const msg =
			body && "error" in body && typeof body.error === "string" ? body.error : "Upload failed";
		throw new Error(msg);
	}

	return body.data;
}

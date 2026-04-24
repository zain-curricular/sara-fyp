import "server-only";

import { getMarketplaceApiOrigin } from "@/lib/api/base-url";

import type { ApiEnvelope, PublicProfile } from "./types";

export async function fetchPublicProfile(id: string): Promise<PublicProfile | null> {
	const origin = getMarketplaceApiOrigin();
	if (!origin) {
		return null;
	}

	const res = await fetch(`${origin}/api/profiles/${id}`, {
		next: { revalidate: 60 },
	});

	if (!res.ok) {
		return null;
	}

	const body = (await res.json()) as ApiEnvelope<PublicProfile>;
	if (!body.ok || !body.data) {
		return null;
	}

	return body.data;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch, ApiError } from "@/lib/api/client";
import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";

import type { UpdateOwnProfileInput } from "./schemas";
import type { ApiEnvelope, OwnProfile, PublicProfile } from "./types";

export const profileQueryKeys = {
	me: ["profiles", "me"] as const,
	public: (id: string) => ["profiles", "public", id] as const,
};

async function parseEnvelope<T>(body: ApiEnvelope<T>): Promise<T> {
	if (!body.ok) {
		throw new Error("error" in body ? body.error : "Request failed");
	}
	return body.data;
}

/** Authenticated GET /api/profiles/me. */
export function useMyProfile() {
	const authFetch = useAuthenticatedFetch();

	return useQuery({
		queryKey: profileQueryKeys.me,
		queryFn: async () => {
			const body = await authFetch<ApiEnvelope<OwnProfile>>("/api/profiles/me");
			return parseEnvelope(body);
		},
		retry: false,
	});
}

/** Public GET /api/profiles/:id (no auth). */
export function usePublicProfile(id: string | undefined) {
	return useQuery({
		queryKey: profileQueryKeys.public(id ?? ""),
		enabled: !!id,
		queryFn: async () => {
			if (!id) {
				throw new Error("Missing profile id");
			}
			const body = await apiFetch<ApiEnvelope<PublicProfile>>(`/api/profiles/${id}`);
			return parseEnvelope(body);
		},
	});
}

/** PATCH /api/profiles/me. */
export function useUpdateProfile() {
	const authFetch = useAuthenticatedFetch();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateOwnProfileInput) => {
			const body = await authFetch<ApiEnvelope<OwnProfile>>("/api/profiles/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return parseEnvelope(body);
		},
		onSuccess: (data) => {
			queryClient.setQueryData(profileQueryKeys.me, data);
			toast.success("Profile saved");
		},
		onError: (error: unknown) => {
			if (error instanceof ApiError && error.status === 409) {
				toast.error("Handle is not available");
				return;
			}
			const msg = error instanceof Error ? error.message : "Could not save profile";
			toast.error(msg);
		},
	});
}

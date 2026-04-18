function getApiBaseUrl(): string {
	const raw = process.env.NEXT_PUBLIC_API_URL;
	if (!raw) {
		return "";
	}
	return raw.replace(/\/$/, "");
}

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly body?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

type ApiFetchOptions = RequestInit & {
	accessToken?: string;
};

/**
 * Typed JSON fetch against the shared marketplace API (`NEXT_PUBLIC_API_URL`).
 * Pass `accessToken` when calling from the client with a Supabase session JWT.
 *
 * @throws Error if `NEXT_PUBLIC_API_URL` is unset (avoids accidental same-origin `fetch`).
 */
export async function apiFetch<T>(path: string, init: ApiFetchOptions = {}): Promise<T> {
	const base = getApiBaseUrl();
	if (!base) {
		throw new Error(
			"NEXT_PUBLIC_API_URL is not set — cannot call the marketplace API (refusing same-origin relative fetch).",
		);
	}

	const { accessToken, ...rest } = init;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	const url = `${base}${normalized}`;

	const headers = new Headers(rest.headers);
	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}
	if (!headers.has("Accept")) {
		headers.set("Accept", "application/json");
	}

	const response = await fetch(url, { ...rest, headers });

	if (!response.ok) {
		let body: unknown;
		const text = await response.text();
		try {
			body = text ? JSON.parse(text) : undefined;
		} catch {
			body = text;
		}
		throw new ApiError(response.statusText || "Request failed", response.status, body);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

type ApiFormFetchOptions = Omit<RequestInit, "body"> & {
	accessToken?: string;
};

/**
 * POST `multipart/form-data` to the marketplace API. Does not set `Content-Type` so the boundary is set correctly.
 * Response body is parsed as JSON (same as {@link apiFetch}).
 */
export async function apiFetchFormData<T>(
	path: string,
	formData: FormData,
	init: ApiFormFetchOptions = {},
): Promise<T> {
	const base = getApiBaseUrl();
	if (!base) {
		throw new Error(
			"NEXT_PUBLIC_API_URL is not set — cannot call the marketplace API (refusing same-origin relative fetch).",
		);
	}

	const { accessToken, ...rest } = init;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	const url = `${base}${normalized}`;

	const headers = new Headers(rest.headers);
	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}
	if (!headers.has("Accept")) {
		headers.set("Accept", "application/json");
	}

	const response = await fetch(url, {
		...rest,
		method: init.method ?? "POST",
		body: formData,
		headers,
	});

	if (!response.ok) {
		let body: unknown;
		const text = await response.text();
		try {
			body = text ? JSON.parse(text) : undefined;
		} catch {
			body = text;
		}
		throw new ApiError(response.statusText || "Request failed", response.status, body);
	}

	return response.json() as Promise<T>;
}

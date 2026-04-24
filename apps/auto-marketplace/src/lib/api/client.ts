import { getMarketplaceApiBaseUrl } from "@/lib/api/base-url";

function getApiBaseUrl(): string {
	return getMarketplaceApiBaseUrl();
}

const API_UPSTREAM_HINT =
	"The marketplace API is not reachable. In a separate terminal, from the repo root run `npm run dev` so the main app listens on the port in `NEXT_PUBLIC_API_URL` (default http://localhost:3000). If the main app uses another port, set `NEXT_PUBLIC_API_URL` to match.";

function isProbablyFailedProxyResponse(status: number, body: unknown): boolean {
	if (status !== 500 && status !== 502 && status !== 503) return false;
	if (typeof body !== "string") return false;
	return body === "Internal Server Error" || body.includes("Internal Server Error");
}

async function fetchOrExplain(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	try {
		return await fetch(input, init);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`${API_UPSTREAM_HINT} (${msg})`);
	}
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
 */
export async function apiFetch<T>(path: string, init: ApiFetchOptions = {}): Promise<T> {
	const base = getApiBaseUrl();
	if (!base && typeof window === "undefined") {
		throw new Error(
			"Marketplace API base URL is not configured — set NEXT_PUBLIC_API_URL to the repo-root app URL (see `src/app/api`).",
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

	const response = await fetchOrExplain(url, { ...rest, headers });

	if (!response.ok) {
		let body: unknown;
		const text = await response.text();
		try {
			body = text ? JSON.parse(text) : undefined;
		} catch {
			body = text;
		}
		if (isProbablyFailedProxyResponse(response.status, body)) {
			throw new Error(API_UPSTREAM_HINT);
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
 * POST `multipart/form-data` to the marketplace API.
 * Does not set `Content-Type` so the boundary is set correctly.
 */
export async function apiFetchFormData<T>(
	path: string,
	formData: FormData,
	init: ApiFormFetchOptions = {},
): Promise<T> {
	const base = getApiBaseUrl();
	if (!base && typeof window === "undefined") {
		throw new Error(
			"Marketplace API base URL is not configured — set NEXT_PUBLIC_API_URL to the repo-root app URL (see `src/app/api`).",
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

	const response = await fetchOrExplain(url, {
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
		if (isProbablyFailedProxyResponse(response.status, body)) {
			throw new Error(API_UPSTREAM_HINT);
		}
		throw new ApiError(response.statusText || "Request failed", response.status, body);
	}

	return response.json() as Promise<T>;
}

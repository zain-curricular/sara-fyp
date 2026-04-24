import { getMarketplaceApiBaseUrl } from "@/lib/api/base-url";

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

/** Typed JSON fetch against the same-app API routes. */
export async function apiFetch<T>(path: string, init: ApiFetchOptions = {}): Promise<T> {
	const base = getMarketplaceApiBaseUrl();
	const { accessToken, ...rest } = init;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	const url = `${base}${normalized}`;

	const headers = new Headers(rest.headers);
	if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
	if (!headers.has("Accept")) headers.set("Accept", "application/json");

	let response: Response;
	try {
		response = await fetch(url, { ...rest, headers });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`API unreachable: ${msg}`);
	}

	if (!response.ok) {
		let body: unknown;
		const text = await response.text();
		try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
		throw new ApiError(response.statusText || "Request failed", response.status, body);
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

type ApiFormFetchOptions = Omit<RequestInit, "body"> & {
	accessToken?: string;
};

/** POST multipart/form-data to the same-app API routes. */
export async function apiFetchFormData<T>(
	path: string,
	formData: FormData,
	init: ApiFormFetchOptions = {},
): Promise<T> {
	const base = getMarketplaceApiBaseUrl();
	const { accessToken, ...rest } = init;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	const url = `${base}${normalized}`;

	const headers = new Headers(rest.headers);
	if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
	if (!headers.has("Accept")) headers.set("Accept", "application/json");

	let response: Response;
	try {
		response = await fetch(url, { ...rest, method: init.method ?? "POST", body: formData, headers });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`API unreachable: ${msg}`);
	}

	if (!response.ok) {
		let body: unknown;
		const text = await response.text();
		try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
		throw new ApiError(response.statusText || "Request failed", response.status, body);
	}

	return response.json() as Promise<T>;
}

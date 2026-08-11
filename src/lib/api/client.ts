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

/**
 * Builds the `ApiError` for a failed response.
 *
 * Routes answer errors as `{ ok: false, error: "..." }` and that text is the
 * only debuggable part — a bare `response.statusText` surfaces to users as
 * "Unprocessable Entity", hiding messages like "Add your payout details before
 * publishing." Prefer the body's `error`, fall back to the status line.
 */
async function toApiError(response: Response): Promise<ApiError> {
	let body: unknown;
	const text = await response.text();
	try {
		body = text ? JSON.parse(text) : undefined;
	} catch {
		body = text;
	}

	const bodyError =
		typeof body === "object" && body !== null && "error" in body
			? (body as { error?: unknown }).error
			: undefined;

	const message =
		typeof bodyError === "string" && bodyError
			? bodyError
			: response.statusText || "Request failed";

	return new ApiError(message, response.status, body);
}

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

	if (!response.ok) throw await toApiError(response);

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

	if (!response.ok) throw await toApiError(response);

	return response.json() as Promise<T>;
}

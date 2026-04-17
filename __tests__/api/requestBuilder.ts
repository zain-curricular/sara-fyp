// ============================================================================
// API integration tests — HTTP Request helpers
// ============================================================================

/**
 * Builds a GET (or any method) Request against a fake origin.
 */
export function buildRequest(path: string, init?: RequestInit): Request {
	return new Request(`http://localhost${path}`, {
		headers: { 'Content-Type': 'application/json', ...init?.headers },
		...init,
	})
}

/**
 * JSON body for POST / PATCH / PUT.
 */
export function buildJsonRequest(
	path: string,
	body: unknown,
	method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
): Request {
	return buildRequest(path, {
		method,
		body: JSON.stringify(body),
	})
}

import { type NextRequest, NextResponse } from "next/server";

/**
 * Browser CORS for `/api/*` when the marketplace mobile app (or other allowed
 * origins) calls the API on a different port/host. Preflight `OPTIONS` must
 * succeed before `Authorization` + multipart requests run.
 *
 * Set `API_CORS_ORIGINS` (comma-separated) in production, e.g.
 * `https://phones.example.com,https://www.example.com`
 */
function configuredOrigins(): Set<string> {
	const raw = process.env.API_CORS_ORIGINS?.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (raw?.length) {
		return new Set(raw);
	}
	return new Set(["http://localhost:3002", "http://127.0.0.1:3002"]);
}

/** Dev: any http origin on localhost / 127.0.0.1 (mobile may use 3001, 3002, …). */
function isLocalhostDevOrigin(origin: string): boolean {
	if (process.env.NODE_ENV !== "development") return false;
	try {
		const u = new URL(origin);
		return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
	} catch {
		return false;
	}
}

function originAllowed(origin: string | null): boolean {
	if (!origin) return false;
	if (configuredOrigins().has(origin)) return true;
	return isLocalhostDevOrigin(origin);
}

function corsHeaders(request: NextRequest): Headers {
	const origin = request.headers.get("origin");
	const headers = new Headers();

	if (!origin || !originAllowed(origin)) {
		return headers;
	}

	headers.set("Access-Control-Allow-Origin", origin);
	headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
	headers.set("Access-Control-Max-Age", "86400");

	const requested = request.headers.get("access-control-request-headers");
	if (requested) {
		headers.set("Access-Control-Allow-Headers", requested);
	} else {
		headers.set(
			"Access-Control-Allow-Headers",
			"Authorization, Content-Type, Accept, X-Requested-With",
		);
	}

	return headers;
}

export function middleware(request: NextRequest) {
	if (!request.nextUrl.pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	if (request.method === "OPTIONS") {
		const headers = corsHeaders(request);
		return new NextResponse(null, { status: 204, headers });
	}

	const response = NextResponse.next();
	const extra = corsHeaders(request);
	extra.forEach((value, key) => {
		response.headers.set(key, value);
	});
	return response;
}

export const config = {
	matcher: "/api/:path*",
};

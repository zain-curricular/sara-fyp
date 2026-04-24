import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Forwards unmatched `/api/*` to the root workspace Next app (`NEXT_PUBLIC_API_URL`).
 * More specific routes (e.g. `app/api/catalog/...`) take precedence.
 */
function upstreamOrigin(): string {
	const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
	if (raw) return raw.replace(/\/$/, "");
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}
	return "";
}

async function proxy(
	request: NextRequest,
	context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
	const origin = upstreamOrigin();
	if (!origin) {
		return NextResponse.json(
			{ ok: false, error: "NEXT_PUBLIC_API_URL is not set — cannot reach the marketplace API" },
			{ status: 503 },
		);
	}

	const { path } = await context.params;
	const sub = path?.join("/") ?? "";
	const url = `${origin}/api/${sub}${request.nextUrl.search}`;

	const headers = new Headers(request.headers);
	headers.delete("host");

	const init: RequestInit & { duplex?: string } = {
		method: request.method,
		headers,
		redirect: "manual",
	};

	if (request.method !== "GET" && request.method !== "HEAD") {
		init.body = request.body;
		init.duplex = "half";
	}

	let res: Response;
	try {
		res = await fetch(url, init);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return NextResponse.json({ ok: false, error: `Upstream API unreachable: ${msg}` }, { status: 502 });
	}

	return new NextResponse(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: res.headers,
	});
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

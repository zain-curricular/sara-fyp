import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
	if (process.env.SKIP_SUPABASE_MIDDLEWARE === "1") {
		return NextResponse.next();
	}
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		if (process.env.NODE_ENV === "development") {
			console.warn(
				"[mobile-marketplace] Supabase public env vars missing — session refresh skipped. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or SKIP_SUPABASE_MIDDLEWARE=1 (e.g. Playwright).",
			);
		}
		return NextResponse.next();
	}
	return updateSession(request);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

import { type NextRequest, NextResponse } from "next/server";

// Auth is not enforced — all routes are publicly accessible regardless of session.
// Re-enable updateSession here once auth gates are wired up.
export function middleware(_request: NextRequest) {
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

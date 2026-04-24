// ============================================================================
// Next.js Middleware — Session Refresh + Route Protection
// ============================================================================
//
// Refreshes the Supabase session cookie on every request (keeps JWTs fresh).
// Protects auth-required routes and admin routes with role checks.

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = new Set([
	"/",
	"/login",
	"/logout",
	"/forgot-password",
	"/reset-password",
	"/403",
	"/404",
	"/about",
	"/terms",
	"/privacy",
	"/contact",
	"/sell-on-shopsmart",
	"/help",
	"/search",
	"/browse",
	"/listings",
	"/sellers",
	"/chatbot",
	"/parts",
	"/assistant",
	"/verify",
]);

function isPublicPath(pathname: string): boolean {
	if (PUBLIC_ROUTES.has(pathname)) return true;
	// Allow dynamic public paths
	if (pathname.startsWith("/listings/")) return true;
	if (pathname.startsWith("/sellers/")) return true;
	if (pathname.startsWith("/browse/")) return true;
	if (pathname.startsWith("/search")) return true;
	if (pathname.startsWith("/help/")) return true;
	if (pathname.startsWith("/parts/")) return true;
	if (pathname.startsWith("/verify/")) return true;
	if (pathname.startsWith("/api/")) return true;
	if (pathname.startsWith("/_next/")) return true;
	return false;
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Refresh session
	let response = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
					response = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Public routes: pass through
	if (isPublicPath(pathname)) return response;

	// Protected routes: require auth
	if (!user) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("next", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Admin routes: require admin role
	if (pathname.startsWith("/admin")) {
		const { data: profile } = await supabase
			.from("profiles")
			.select("roles")
			.eq("id", user.id)
			.maybeSingle();

		const roles = (profile?.roles as string[]) ?? [];
		if (!roles.includes("admin")) {
			return NextResponse.redirect(new URL("/403", request.url));
		}
	}

	// Mechanic routes: require mechanic role
	if (pathname.startsWith("/mechanic")) {
		const { data: profile } = await supabase
			.from("profiles")
			.select("roles")
			.eq("id", user.id)
			.maybeSingle();

		const roles = (profile?.roles as string[]) ?? [];
		if (!roles.includes("mechanic") && !roles.includes("admin")) {
			return NextResponse.redirect(new URL("/403", request.url));
		}
	}

	// Seller routes: require seller role
	if (pathname.startsWith("/seller") || pathname.startsWith("/become-a-seller")) {
		const { data: profile } = await supabase
			.from("profiles")
			.select("roles")
			.eq("id", user.id)
			.maybeSingle();

		const roles = (profile?.roles as string[]) ?? [];
		if (
			!roles.includes("seller") &&
			!roles.includes("admin") &&
			pathname !== "/become-a-seller"
		) {
			return NextResponse.redirect(new URL("/become-a-seller", request.url));
		}
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};

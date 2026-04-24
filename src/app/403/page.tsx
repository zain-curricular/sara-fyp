// ============================================================================
// 403 Forbidden Page
// ============================================================================
//
// Shown when a user is authenticated but lacks the required role for a route.
// Fetches session server-side to show the user their current roles and provide
// contextual links to areas they can access.
//
// Also handles the unauthenticated case — shows "Not signed in" with a link
// to /login.

import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { getServerSession } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Access denied — ShopSmart",
};

// Role → label + destination
const ROLE_DESTINATIONS: Record<string, { label: string; href: string }> = {
	buyer: { label: "Buyer dashboard", href: "/buyer" },
	seller: { label: "Seller dashboard", href: "/seller" },
	admin: { label: "Admin dashboard", href: "/admin" },
};

export default async function ForbiddenPage() {
	const session = await getServerSession();

	// Not signed in
	if (!session) {
		return (
			<div
				container-id="forbidden-unauthenticated"
				className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4"
			>
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10">
							<svg
								aria-hidden
								className="size-7 text-destructive"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.5}
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
								/>
							</svg>
						</div>
						<CardTitle className="text-xl">Not signed in</CardTitle>
						<CardDescription>
							You need to be signed in to access this page.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/login" className={cn(buttonVariants(), "w-full")}>
							Sign in
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Signed in but wrong role
	const validDestinations = session.roles
		.map((role) => ROLE_DESTINATIONS[role])
		.filter(Boolean);

	return (
		<div
			container-id="forbidden-role-mismatch"
			className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4"
		>
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10">
						<svg
							aria-hidden
							className="size-7 text-destructive"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.5}
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
							/>
						</svg>
					</div>
					<CardTitle className="text-xl">Access denied</CardTitle>
					<CardDescription>
						You don't have permission to view that page.
					</CardDescription>
				</CardHeader>

				<CardContent className="flex flex-col gap-4">

					{/* Current roles */}
					<div container-id="forbidden-roles" className="flex flex-col gap-2">
						<p className="text-xs font-medium text-muted-foreground">Your current roles</p>
						<div className="flex flex-wrap justify-center gap-1.5">
							{session.roles.map((role) => (
								<Badge key={role} variant="secondary">
									{role}
								</Badge>
							))}
						</div>
					</div>

					{/* Links to valid areas */}
					{validDestinations.length > 0 && (
						<div container-id="forbidden-destinations" className="flex flex-col gap-2">
							<p className="text-xs font-medium text-muted-foreground">Where you can go</p>
							<div className="flex flex-col gap-2">
								{validDestinations.map(({ label, href }) => (
									<Link key={href} href={href} className={cn(buttonVariants({ variant: "outline" }))}>
										{label}
									</Link>
								))}
							</div>
						</div>
					)}

					<Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
						Return to home
					</Link>

				</CardContent>
			</Card>
		</div>
	);
}

import { AppShell } from "@/components/layout/app-shell";

/**
 * Public routes: no auth gate; optional session is read per-page when needed (e.g. listing owner).
 * This differs from authenticated dashboard routes that fetch user + data in `page.tsx` before shell.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return <AppShell>{children}</AppShell>;
}

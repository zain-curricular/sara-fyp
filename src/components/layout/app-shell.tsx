import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div container-id="app-shell" className="flex min-h-0 flex-1 flex-col">
			<SiteHeader />
			<main
				container-id="app-shell-main"
				className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
			>
				{children}
			</main>
			<SiteFooter />
		</div>
	);
}

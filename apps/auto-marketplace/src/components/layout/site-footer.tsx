export function SiteFooter() {
	return (
		<footer container-id="site-footer" className="mt-12 border-t border-border bg-muted/30">
			<div
				container-id="site-footer-inner"
				className="mx-auto flex w-full max-w-6xl flex-col items-start gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
			>
				<p>© {new Date().getFullYear()} Marketplace</p>
				<p className="text-xs uppercase tracking-wide">
					Auto platform — shared Supabase backend
				</p>
			</div>
		</footer>
	);
}

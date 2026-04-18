export function SiteFooter() {
	return (
		<footer className="border-t border-border bg-muted/30">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<p>© {new Date().getFullYear()} Marketplace</p>
				<p className="text-xs">Mobile platform — shared Supabase backend</p>
			</div>
		</footer>
	);
}

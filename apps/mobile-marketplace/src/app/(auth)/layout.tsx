import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div container-id="auth-layout" className="flex min-h-full flex-1 flex-col bg-muted/20">
			<div
				container-id="auth-layout-header"
				className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6"
			>
				<div className="mx-auto flex w-full max-w-6xl items-center">
					<Link href="/" className="flex items-center gap-2">
						<span className="size-2.5 rounded-full bg-brand" />
						<span className="text-sm font-bold tracking-tight">
							mobile<span className="text-primary">mart</span>
						</span>
					</Link>
				</div>
			</div>
			<div
				container-id="auth-layout-main"
				className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16"
			>
				{children}
			</div>
		</div>
	);
}

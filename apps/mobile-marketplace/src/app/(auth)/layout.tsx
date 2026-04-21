import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div container-id="auth-layout" className="flex min-h-full flex-1 flex-col bg-muted/20">
			<div
				container-id="auth-layout-header"
				className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6"
			>
				<div className="mx-auto flex w-full max-w-6xl items-center">
					<Link href="/" className="text-sm font-semibold tracking-tight">
						Mobile marketplace
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

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-full flex-1 flex-col">
			<div className="border-b border-border bg-background px-4 py-3 sm:px-6">
				<Link href="/" className="text-sm font-semibold tracking-tight">
					Mobile marketplace
				</Link>
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-4">{children}</div>
		</div>
	);
}

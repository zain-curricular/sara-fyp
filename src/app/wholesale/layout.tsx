// ============================================================================
// Wholesale Layout
// ============================================================================
//
// Minimal layout wrapper for all wholesale routes. No sidebar — wholesale
// pages share the root app shell.

import type { ReactNode } from "react";

export default function WholesaleLayout({ children }: { children: ReactNode }) {
	return (
		<div container-id="wholesale-layout" className="flex flex-col flex-1 min-h-0">
			{children}
		</div>
	);
}

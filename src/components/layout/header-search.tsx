// ============================================================================
// Header Search
// ============================================================================
//
// The search field in the site header. Client island — the header itself is a
// server component, so the typing/submit behaviour lives here.
//
// Submitting pushes `/search?platform=automotive&q=…` so the result page stays
// bookmarkable and shareable. An empty query still navigates to /search, which
// renders the unfiltered browse grid.
//
// Progressive Enhancement
// -----------------------
// The wrapper is a real `<form method="get" action="/search">`, so the field
// still works if hydration has not landed yet. Once hydrated, `onSubmit`
// intercepts and does a client-side navigation instead of a full page load.

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type HeaderSearchProps = {
	className?: string;
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/** Pill-shaped keyword search field for the site header. */
export function HeaderSearch({ className }: HeaderSearchProps) {
	const router = useRouter();
	const [q, setQ] = useState("");

	/** Intercepts the native GET submit and navigates client-side instead. */
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const keyword = q.trim();
		const sp = new URLSearchParams({ platform: "automotive" });
		if (keyword) sp.set("q", keyword);

		router.push(`/search?${sp.toString()}`);
	}

	return (
		<form
			container-id="site-header-search"
			role="search"
			method="get"
			action="/search"
			onSubmit={handleSubmit}
			className={cn(
				"flex items-center gap-2.5 rounded-full border border-border bg-muted/50 px-4 py-2 transition-colors focus-within:border-ring focus-within:bg-background",
				className,
			)}
		>
			<Search className="size-3.5 shrink-0 text-muted-foreground" />

			{/*
			  Plain <input> rather than the Input primitive: this field is
			  chrome-less by design — the pill wrapper owns the border, radius,
			  and focus ring, so the primitive's own box styling would double up.
			*/}
			<input
				type="search"
				name="q"
				value={q}
				onChange={(event) => setQ(event.target.value)}
				aria-label="Search parts, brands and vehicles"
				placeholder="Search parts, brands, vehicles…"
				className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>

			{/* Submit lives off-screen — Enter submits, the icon is decorative */}
			<button type="submit" className="sr-only">
				Search
			</button>
		</form>
	);
}

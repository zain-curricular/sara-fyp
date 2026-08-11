"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60_000,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{/*
			  Light mode only. The app ships no theme toggle, so following the OS
			  preference just meant dark-mode machines got an unreviewed dark UI.
			  `forcedTheme` also overrides any stale `theme` value left in a
			  visitor's localStorage from before this change.

			  The `.dark` block in globals.css is left intact but inert — drop
			  `forcedTheme` and restore `enableSystem` to bring dark mode back.
			*/}
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				forcedTheme="light"
				enableSystem={false}
				disableTransitionOnChange
			>
				{children}
				<Toaster richColors position="top-center" />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

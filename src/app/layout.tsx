import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/lib/providers/app-providers";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

import "./globals.css";

const fontSans = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
	display: "swap",
	weight: ["400", "500", "600", "700"],
});

const fontMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Auto marketplace",
	description: "AI-powered vehicle spare parts marketplace",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${fontSans.variable} ${fontMono.variable} h-full`}
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col bg-background font-sans text-foreground antialiased">
				<AppProviders>
					{children}
					<ChatbotWidget />
				</AppProviders>
			</body>
		</html>
	);
}

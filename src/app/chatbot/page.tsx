// ============================================================================
// Chatbot — Page (RSC)
// ============================================================================
//
// Full-page chat interface. Passes optional userId from server session
// to the client shell for authenticated context.

import { getServerSession } from "@/lib/auth/guards";
import ChatbotShell from "./shell";

export const metadata = {
	title: "AI Assistant — ShopSmart",
	description: "Ask ShopSmart's AI about spare parts, compatibility, and your orders.",
};

export default async function ChatbotPage() {
	const session = await getServerSession();

	return <ChatbotShell userId={session?.userId ?? null} />;
}

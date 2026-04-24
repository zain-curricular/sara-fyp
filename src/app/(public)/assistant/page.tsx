// ============================================================================
// Assistant Page (RSC)
// ============================================================================
//
// Public chatbot page. No auth required. Renders the client shell which
// manages the chat session entirely in local state.

import type { Metadata } from "next";

import AssistantShell from "./shell";

export const metadata: Metadata = {
	title: "AI Assistant — ShopSmart",
	description: "Ask our AI assistant anything about auto parts, compatibility, or your orders.",
};

export default function AssistantPage() {
	return <AssistantShell />;
}

// ============================================================================
// /messages/[conversationId] — Direct Conversation Link
// ============================================================================
//
// Redirects to /messages?conversation=[id] so the shell can pre-select the
// conversation. This keeps the shell as the single rendering surface while
// allowing deep-linked conversation URLs (e.g. from notification clicks).

import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
	const { conversationId } = await params;
	redirect(`/messages?conversation=${encodeURIComponent(conversationId)}`);
}

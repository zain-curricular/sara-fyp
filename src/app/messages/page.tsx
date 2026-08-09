// ============================================================================
// /messages — Messages Page (RSC)
// ============================================================================
//
// Authenticates the user, redirects guests to /login, SSR-fetches the
// conversation list, and renders MessagesShell with initial data.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listConversations } from "@/lib/features/messaging/services";

import MessagesShell from "./shell";

export const metadata = {
	title: "Messages",
};

export default async function MessagesPage() {
	const session = await getServerSession();
	if (!session) {
		redirect("/login?next=/messages");
	}

	// Every conversation the user is in, buyer- or seller-side — the shell derives
	// role and unread count per row from the current user id.
	const { data: conversations } = await listConversations(session.userId);

	return (
		<MessagesShell
			initialConversations={conversations ?? []}
			currentUserId={session.userId}
		/>
	);
}

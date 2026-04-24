// ============================================================================
// /notifications — Notifications Page (RSC)
// ============================================================================
//
// Authenticates the user, redirects guests to /login, SSR-fetches the
// notification list, and renders NotificationsShell with initial data.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listNotifications } from "@/lib/features/notifications/services";

import NotificationsShell from "./shell";

export const metadata = {
	title: "Notifications",
};

export default async function NotificationsPage() {
	const session = await getServerSession();
	if (!session) {
		redirect("/login?next=/notifications");
	}

	const { data: notifications } = await listNotifications(session.userId);

	return (
		<NotificationsShell
			initialNotifications={notifications ?? []}
			currentUserId={session.userId}
		/>
	);
}

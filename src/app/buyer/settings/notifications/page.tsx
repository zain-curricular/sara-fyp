// ============================================================================
// Buyer Notification Settings Page — RSC
// ============================================================================
//
// Fetches the user's current notification preferences from their profile,
// then passes them to the client shell for toggle display and mutation.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import NotificationsSettingsShell from "./shell";

export type NotificationPreferences = {
	orderUpdatesEmail: boolean;
	orderUpdatesInApp: boolean;
	messagesEmail: boolean;
	messagesInApp: boolean;
	disputesEmail: boolean;
	disputesInApp: boolean;
	promotionsEmail: boolean;
	promotionsInApp: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
	orderUpdatesEmail: true,
	orderUpdatesInApp: true,
	messagesEmail: true,
	messagesInApp: true,
	disputesEmail: true,
	disputesInApp: true,
	promotionsEmail: false,
	promotionsInApp: false,
};

export default async function BuyerNotificationsSettingsPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/settings/notifications");

	const supabase = await createServerSupabaseClient();

	const { data: profile } = await supabase
		.from("profiles")
		.select("notification_preferences")
		.eq("id", session.userId)
		.maybeSingle();

	const saved = (profile as Record<string, unknown> | null)
		?.notification_preferences as Partial<NotificationPreferences> | null;

	const preferences: NotificationPreferences = {
		...DEFAULT_PREFERENCES,
		...(saved ?? {}),
	};

	return (
		<NotificationsSettingsShell
			userId={session.userId}
			preferences={preferences}
		/>
	);
}

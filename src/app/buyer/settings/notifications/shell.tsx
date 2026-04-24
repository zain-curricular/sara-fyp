// ============================================================================
// Notification Settings Shell — Client Component
// ============================================================================
//
// Toggle switches for email and in-app notification categories. Debounces
// saves to avoid excessive requests — each toggle calls PATCH /api/profiles/me
// with updated notification_preferences JSONB payload.

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import type { NotificationPreferences } from "./page";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type NotificationCategory = {
	key: keyof NotificationPreferences;
	label: string;
};

type NotificationGroup = {
	title: string;
	email: NotificationCategory;
	inApp: NotificationCategory;
};

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const NOTIFICATION_GROUPS: NotificationGroup[] = [
	{
		title: "Order updates",
		email: { key: "orderUpdatesEmail", label: "Email" },
		inApp: { key: "orderUpdatesInApp", label: "In-app" },
	},
	{
		title: "Messages",
		email: { key: "messagesEmail", label: "Email" },
		inApp: { key: "messagesInApp", label: "In-app" },
	},
	{
		title: "Disputes",
		email: { key: "disputesEmail", label: "Email" },
		inApp: { key: "disputesInApp", label: "In-app" },
	},
	{
		title: "Promotions",
		email: { key: "promotionsEmail", label: "Email" },
		inApp: { key: "promotionsInApp", label: "In-app" },
	},
];

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function NotificationsSettingsShell({
	userId,
	preferences: initialPreferences,
}: {
	userId: string;
	preferences: NotificationPreferences;
}) {
	const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences);
	const [saving, setSaving] = useState(false);
	const authFetch = useAuthenticatedFetch();

	// We don't need userId for the API call since auth identifies the user,
	// but keeping it for potential future use
	void userId;

	const save = useCallback(
		async (updated: NotificationPreferences) => {
			setSaving(true);
			try {
				const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
					"/api/profiles/me",
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							notification_preferences: updated,
						}),
					},
				);
				if (!res.ok) throw new Error("Failed to save");
				toast.success("Preferences saved");
			} catch {
				toast.error("Failed to save preferences");
			} finally {
				setSaving(false);
			}
		},
		[authFetch],
	);

	function toggle(key: keyof NotificationPreferences) {
		const updated = { ...prefs, [key]: !prefs[key] };
		setPrefs(updated);
		void save(updated);
	}

	return (
		<div
			container-id="notifications-settings-shell"
			className="flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Notifications
				</h1>
				<p className="text-sm text-muted-foreground">
					Choose how you want to be notified.
				</p>
			</header>

			<div
				container-id="notification-groups"
				className="flex flex-col gap-6"
			>
				{NOTIFICATION_GROUPS.map((group) => (
					<div
						key={group.title}
						container-id={`notification-group-${group.title.toLowerCase().replace(/\s+/g, "-")}`}
						className="flex flex-col gap-3"
					>
						<div className="flex flex-col gap-0.5">
							<h2 className="text-sm font-semibold">{group.title}</h2>
						</div>

						<div className="flex flex-col gap-2">
							{[group.email, group.inApp].map((channel) => (
								<label
									key={channel.key}
									className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
								>
									<span className="text-sm">{channel.label}</span>
									<button
										role="switch"
										aria-checked={prefs[channel.key]}
										type="button"
										disabled={saving}
										onClick={() => toggle(channel.key)}
										className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
											prefs[channel.key]
												? "bg-primary"
												: "bg-input"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
												prefs[channel.key]
													? "translate-x-5"
													: "translate-x-0"
											}`}
										/>
									</button>
								</label>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

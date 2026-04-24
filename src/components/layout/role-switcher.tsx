// ============================================================================
// Role Switcher
// ============================================================================
//
// Dropdown component that shows the user's current active role and allows
// switching to any other role they hold. Calls POST /api/auth/switch-role
// then refreshes the page so the new role takes effect across the UI.
//
// Intended for use in the site header or account menu. Renders nothing when
// the user holds only one role (nothing to switch to).

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/primitives/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface RoleSwitcherProps {
	/** All roles the user holds. */
	roles: string[];
	/** The currently active role. */
	activeRole: string;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
	buyer: "Buyer",
	seller: "Seller",
	admin: "Admin",
};

function roleLabel(role: string): string {
	return ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/**
 * Role switcher dropdown for users who hold multiple roles.
 * Renders null when the user has only one role.
 */
export function RoleSwitcher({ roles, activeRole }: RoleSwitcherProps) {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	// Nothing to switch if only one role
	if (roles.length <= 1) return null;

	async function handleSwitch(role: string) {
		if (role === activeRole || pending) return;

		setPending(true);

		try {
			const res = await fetch("/api/auth/switch-role", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role }),
			});

			const json = await res.json();

			if (!json.ok) {
				toast.error(json.error ?? "Failed to switch role");
				return;
			}

			router.refresh();
		} catch {
			toast.error("Failed to switch role. Check your connection.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div container-id="role-switcher" className="flex items-center gap-2">
			<span className="hidden text-xs text-muted-foreground sm:block">Viewing as</span>

			<Select value={activeRole} onValueChange={(value) => { if (value) handleSwitch(value); }} disabled={pending}>
				<SelectTrigger size="sm" className="min-w-[100px]" aria-label="Switch role">
					<SelectValue>
						<Badge variant="secondary" className="text-xs">
							{roleLabel(activeRole)}
						</Badge>
					</SelectValue>
				</SelectTrigger>

				<SelectContent>
					{roles.map((role) => (
						<SelectItem key={role} value={role}>
							{roleLabel(role)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

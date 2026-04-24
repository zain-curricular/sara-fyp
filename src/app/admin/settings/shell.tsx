// ============================================================================
// Admin Settings Shell
// ============================================================================
//
// Editable key-value table for platform settings.
// Each row has inline edit save: POST /api/admin/settings { key, value }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

import type { PlatformSetting } from "@/lib/features/admin";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	settings: PlatformSetting[];
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminSettingsShell({ settings }: Props) {
	const router = useRouter();
	const [values, setValues] = useState<Record<string, string>>(
		Object.fromEntries(settings.map((s) => [s.key, s.value])),
	);
	const [loading, setLoading] = useState<string | null>(null);

	async function save(key: string) {
		setLoading(key);
		try {
			const res = await fetch("/api/admin/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key, value: values[key] }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success(`Saved ${key}`);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	return (
		<div container-id="admin-settings" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-settings-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
				<p className="text-sm text-muted-foreground">{settings.length} setting(s)</p>
			</header>

			{/* Settings table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="size-4" aria-hidden />
						Configuration
					</CardTitle>
				</CardHeader>
				<CardContent>
					{settings.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No settings configured.
						</p>
					) : (
						<div container-id="admin-settings-table" className="flex flex-col gap-4">
							{settings.map((setting) => (
								<div
									key={setting.key}
									container-id="admin-setting-row"
									className="grid grid-cols-[1fr_auto] items-end gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0"
								>
									<div className="flex flex-col gap-1">
										<label
											htmlFor={`setting-${setting.key}`}
											className="text-xs font-medium text-muted-foreground"
										>
											{setting.key}
											<span className="ml-2 text-[10px] tabular-nums text-muted-foreground/60">
												Updated: {new Date(setting.updatedAt).toLocaleDateString("en-PK")}
											</span>
										</label>
										<Input
											id={`setting-${setting.key}`}
											value={values[setting.key] ?? ""}
											onChange={(e) =>
												setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
											}
										/>
									</div>
									<Button
										size="sm"
										variant={values[setting.key] !== setting.value ? "default" : "outline"}
										onClick={() => save(setting.key)}
										disabled={loading === setting.key}
									>
										<Save className="size-3.5" aria-hidden />
										Save
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ============================================================================
// Admin User Detail Shell
// ============================================================================
//
// Shows user profile card, ban/unban with note input, grant admin role,
// and tabbed view of orders / listings / admin actions.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Gavel,
	Package,
	Shield,
	ShoppingBag,
	UserCheck,
	UserX,
} from "lucide-react";
import { toast } from "sonner";

import type { AdminAction, AdminListing, AdminOrder, AdminUser } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";
import Link from "next/link";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type FullUser = AdminUser & {
	orders: AdminOrder[];
	listings: AdminListing[];
	adminActions: AdminAction[];
};

type Props = {
	user: FullUser;
	adminId: string;
};

// ----------------------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------------------

type TabValue = "orders" | "listings" | "actions";

const TABS: { value: TabValue; label: string }[] = [
	{ value: "orders", label: "Orders" },
	{ value: "listings", label: "Listings" },
	{ value: "actions", label: "Admin Actions" },
];

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminUserDetailShell({ user, adminId }: Props) {
	const router = useRouter();
	const [tab, setTab] = useState<TabValue>("orders");
	const [banNote, setBanNote] = useState("");
	const [showBanInput, setShowBanInput] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleBan() {
		if (!banNote.trim()) {
			toast.error("Please enter a reason for banning");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/users/${user.id}/ban`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note: banNote }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed to ban");
			toast.success("User banned");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
			setShowBanInput(false);
			setBanNote("");
		}
	}

	async function handleUnban() {
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/users/${user.id}/unban`, {
				method: "POST",
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed to unban");
			toast.success("User unbanned");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	async function handleGrantAdmin() {
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/users/${user.id}/grant-admin`, {
				method: "POST",
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Admin role granted");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div container-id="admin-user-detail" className="flex flex-col gap-6">

			{/* Back */}
			<Link href="/admin/users" className={buttonVariants({ variant: "ghost", size: "sm" })}>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to users
			</Link>

			{/* Profile card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserCheck className="size-4" aria-hidden />
						User profile
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">

					<div container-id="admin-user-info" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">Name</p>
							<p className="font-medium">{user.fullName ?? "—"}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Email</p>
							<p className="font-medium">{user.email}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">City</p>
							<p className="font-medium">{user.city ?? "—"}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Roles</p>
							<div className="flex flex-wrap gap-1">
								{user.roles.map((r) => (
									<Badge key={r} variant="secondary">{r}</Badge>
								))}
							</div>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Status</p>
							{user.isBanned ? (
								<Badge variant="destructive">Banned</Badge>
							) : (
								<Badge variant="outline">Active</Badge>
							)}
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Joined</p>
							<p className="font-medium tabular-nums">
								{new Date(user.createdAt).toLocaleDateString("en-PK")}
							</p>
						</div>
					</div>

					<Separator />

					{/* Actions */}
					<div container-id="admin-user-actions" className="flex flex-wrap items-start gap-2">
						{user.isBanned ? (
							<Button
								variant="outline"
								size="sm"
								onClick={handleUnban}
								disabled={loading}
							>
								<UserCheck className="size-3.5" aria-hidden />
								Unban user
							</Button>
						) : (
							<>
								{!showBanInput ? (
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setShowBanInput(true)}
										disabled={loading}
									>
										<UserX className="size-3.5" aria-hidden />
										Ban user
									</Button>
								) : (
									<div className="flex w-full max-w-sm flex-col gap-2">
										<Textarea
											placeholder="Reason for ban…"
											value={banNote}
											onChange={(e) => setBanNote(e.target.value)}
											rows={2}
										/>
										<div className="flex gap-2">
											<Button
												variant="destructive"
												size="sm"
												onClick={handleBan}
												disabled={loading || !banNote.trim()}
											>
												Confirm ban
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setShowBanInput(false);
													setBanNote("");
												}}
											>
												Cancel
											</Button>
										</div>
									</div>
								)}
							</>
						)}

						{!user.roles.includes("admin") && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleGrantAdmin}
								disabled={loading}
							>
								<Shield className="size-3.5" aria-hidden />
								Grant admin role
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<div container-id="admin-user-tabs" className="flex flex-col gap-4">

				<div className="flex gap-1 border-b border-border">
					{TABS.map((t) => (
						<button
							key={t.value}
							onClick={() => setTab(t.value)}
							className={`px-4 py-2 text-sm font-medium transition-colors ${
								tab === t.value
									? "border-b-2 border-primary text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Orders tab */}
				{tab === "orders" && (
					<Card>
						<CardContent className="pt-4">
							{user.orders.length === 0 ? (
								<p className="py-4 text-center text-sm text-muted-foreground">No orders.</p>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border text-left text-xs text-muted-foreground">
											<th className="pb-2 pr-4 font-medium">Order #</th>
											<th className="pb-2 pr-4 font-medium">Total</th>
											<th className="pb-2 pr-4 font-medium">Status</th>
											<th className="pb-2 font-medium">Date</th>
										</tr>
									</thead>
									<tbody>
										{user.orders.map((o) => (
											<tr key={o.id} className="border-b border-border/50 last:border-0">
												<td className="py-2 pr-4">
													<Link
														href={`/admin/orders/${o.id}`}
														className="text-primary hover:underline"
													>
														{o.orderNumber}
													</Link>
												</td>
												<td className="py-2 pr-4 tabular-nums">
													{formatPKR(o.total)}
												</td>
												<td className="py-2 pr-4">
													<Badge variant="secondary">{o.ssStatus.replace(/_/g, " ")}</Badge>
												</td>
												<td className="py-2 text-muted-foreground tabular-nums">
													{new Date(o.placedAt).toLocaleDateString("en-PK")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</CardContent>
					</Card>
				)}

				{/* Listings tab */}
				{tab === "listings" && (
					<Card>
						<CardContent className="pt-4">
							{user.listings.length === 0 ? (
								<p className="py-4 text-center text-sm text-muted-foreground">No listings.</p>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border text-left text-xs text-muted-foreground">
											<th className="pb-2 pr-4 font-medium">Title</th>
											<th className="pb-2 pr-4 font-medium">Price</th>
											<th className="pb-2 pr-4 font-medium">Status</th>
											<th className="pb-2 font-medium">Created</th>
										</tr>
									</thead>
									<tbody>
										{user.listings.map((l) => (
											<tr key={l.id} className="border-b border-border/50 last:border-0">
												<td className="py-2 pr-4">
													<Link
														href={`/admin/listings/${l.id}`}
														className="text-primary hover:underline"
													>
														{l.title}
													</Link>
												</td>
												<td className="py-2 pr-4 tabular-nums">{formatPKR(l.price)}</td>
												<td className="py-2 pr-4">
													<Badge variant="secondary">{l.status}</Badge>
												</td>
												<td className="py-2 text-muted-foreground tabular-nums">
													{new Date(l.createdAt).toLocaleDateString("en-PK")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</CardContent>
					</Card>
				)}

				{/* Admin actions tab */}
				{tab === "actions" && (
					<Card>
						<CardContent className="pt-4">
							{user.adminActions.length === 0 ? (
								<p className="py-4 text-center text-sm text-muted-foreground">
									No admin actions recorded.
								</p>
							) : (
								<div className="flex flex-col divide-y divide-border">
									{user.adminActions.map((a) => (
										<div key={a.id} className="flex flex-col gap-0.5 py-2.5">
											<div className="flex items-center justify-between">
												<span className="font-medium capitalize">
													{a.action.replace(/_/g, " ")}
												</span>
												<span className="text-xs text-muted-foreground tabular-nums">
													{new Date(a.createdAt).toLocaleDateString("en-PK")}
												</span>
											</div>
											{a.note && (
												<p className="text-xs text-muted-foreground">{a.note}</p>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

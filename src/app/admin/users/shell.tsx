// ============================================================================
// Admin Users Shell
// ============================================================================
//
// Search + role filter tabs, user table with banned badge, link to detail.
// Search is debounced — pushes query params to re-run the RSC.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserCheck } from "lucide-react";

import type { AdminUser } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	users: AdminUser[];
	initialSearch: string;
	initialRole: string;
};

// ----------------------------------------------------------------------------
// Role tabs
// ----------------------------------------------------------------------------

const ROLE_TABS = [
	{ value: "all", label: "All" },
	{ value: "buyer", label: "Buyers" },
	{ value: "seller", label: "Sellers" },
	{ value: "mechanic", label: "Mechanics" },
	{ value: "admin", label: "Admins" },
] as const;

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminUsersShell({ users, initialSearch, initialRole }: Props) {
	const router = useRouter();
	const [search, setSearch] = useState(initialSearch);
	const [role, setRole] = useState(initialRole);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounced search → update URL
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (role !== "all") params.set("role", role);
			router.push(`/admin/users?${params.toString()}`);
		}, 350);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [search, role, router]);

	return (
		<div container-id="admin-users" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-users-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Users</h1>
				<p className="text-sm text-muted-foreground">{users.length} result(s)</p>
			</header>

			{/* Controls */}
			<div container-id="admin-users-controls" className="flex flex-col gap-3">

				{/* Search */}
				<div className="relative w-full max-w-sm">
					<Search
						className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<Input
						placeholder="Search name or email…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>

				{/* Role tabs */}
				<div className="flex flex-wrap gap-1">
					{ROLE_TABS.map((tab) => (
						<Button
							key={tab.value}
							variant={role === tab.value ? "default" : "outline"}
							size="sm"
							onClick={() => setRole(tab.value)}
						>
							{tab.label}
						</Button>
					))}
				</div>
			</div>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserCheck className="size-4" aria-hidden />
						User accounts
					</CardTitle>
				</CardHeader>
				<CardContent>
					{users.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
					) : (
						<div container-id="admin-users-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Name / Email</th>
										<th className="pb-2 pr-4 font-medium">Roles</th>
										<th className="pb-2 pr-4 font-medium">City</th>
										<th className="pb-2 pr-4 font-medium">Joined</th>
										<th className="pb-2 font-medium">Status</th>
										<th className="pb-2" />
									</tr>
								</thead>
								<tbody>
									{users.map((user) => (
										<tr
											key={user.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4">
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">
														{user.fullName ?? "—"}
													</span>
													<span className="text-xs text-muted-foreground">
														{user.email}
													</span>
												</div>
											</td>
											<td className="py-3 pr-4">
												<div className="flex flex-wrap gap-1">
													{user.roles.map((r) => (
														<Badge key={r} variant="secondary">
															{r}
														</Badge>
													))}
												</div>
											</td>
											<td className="py-3 pr-4 text-muted-foreground">
												{user.city ?? "—"}
											</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{new Date(user.createdAt).toLocaleDateString("en-PK", {
													year: "numeric",
													month: "short",
													day: "numeric",
												})}
											</td>
											<td className="py-3 pr-4">
												{user.isBanned ? (
													<Badge variant="destructive">Banned</Badge>
												) : (
													<Badge variant="outline">Active</Badge>
												)}
											</td>
											<td className="py-3 text-right">
												<Link
													href={`/admin/users/${user.id}`}
													className={buttonVariants({ variant: "ghost", size: "sm" })}
												>
													View
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

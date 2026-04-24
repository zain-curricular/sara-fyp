// ============================================================================
// Admin Catalog Shell
// ============================================================================
//
// Two tabs: Categories (with add/edit/delete) and Vehicles (with add/delete).
// All mutations call /api/admin/catalog/* routes and refresh on success.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Grid3X3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { AdminCategory, AdminVehicle } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	categories: AdminCategory[];
	vehicles: AdminVehicle[];
};

type Tab = "categories" | "vehicles";

// ----------------------------------------------------------------------------
// Categories tab
// ----------------------------------------------------------------------------

function CategoriesTab({
	categories,
	onRefresh,
}: {
	categories: AdminCategory[];
	onRefresh: () => void;
}) {
	const [loading, setLoading] = useState<string | null>(null);
	const [newName, setNewName] = useState("");
	const [newSlug, setNewSlug] = useState("");
	const [editId, setEditId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editSlug, setEditSlug] = useState("");

	async function addCategory() {
		if (!newName.trim() || !newSlug.trim()) {
			toast.error("Name and slug are required");
			return;
		}
		setLoading("add");
		try {
			const res = await fetch("/api/admin/catalog/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newName, slug: newSlug, parentId: null }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Category created");
			setNewName("");
			setNewSlug("");
			onRefresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	async function updateCategory(id: string) {
		if (!editName.trim() || !editSlug.trim()) {
			toast.error("Name and slug are required");
			return;
		}
		setLoading(id);
		try {
			const res = await fetch(`/api/admin/catalog/categories/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName, slug: editSlug }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Category updated");
			setEditId(null);
			onRefresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	async function deleteCategory(id: string) {
		if (!window.confirm("Delete this category? This cannot be undone.")) return;
		setLoading(id);
		try {
			const res = await fetch(`/api/admin/catalog/categories/${id}`, { method: "DELETE" });
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Category deleted");
			onRefresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	function startEdit(cat: AdminCategory) {
		setEditId(cat.id);
		setEditName(cat.name);
		setEditSlug(cat.slug);
	}

	return (
		<div container-id="admin-categories" className="flex flex-col gap-4">

			{/* Add form */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-sm">Add category</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap items-end gap-2">
					<div className="flex flex-col gap-1">
						<label className="text-xs text-muted-foreground">Name</label>
						<Input
							placeholder="e.g. Engine Parts"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="w-40"
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-xs text-muted-foreground">Slug</label>
						<Input
							placeholder="e.g. engine-parts"
							value={newSlug}
							onChange={(e) => setNewSlug(e.target.value)}
							className="w-40"
						/>
					</div>
					<Button
						size="sm"
						onClick={addCategory}
						disabled={loading === "add" || !newName.trim() || !newSlug.trim()}
					>
						<Plus className="size-3.5" aria-hidden />
						Add
					</Button>
				</CardContent>
			</Card>

			{/* Table */}
			<div container-id="admin-categories-table" className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border text-left text-xs text-muted-foreground">
							<th className="pb-2 pr-4 font-medium">Name</th>
							<th className="pb-2 pr-4 font-medium">Slug</th>
							<th className="pb-2 pr-4 font-medium">Parent</th>
							<th className="pb-2 pr-4 font-medium">Children</th>
							<th className="pb-2 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{categories.map((cat) => (
							<tr key={cat.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
								<td className="py-3 pr-4">
									{editId === cat.id ? (
										<Input
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											className="h-7 w-36"
										/>
									) : (
										<span className="font-medium">{cat.name}</span>
									)}
								</td>
								<td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
									{editId === cat.id ? (
										<Input
											value={editSlug}
											onChange={(e) => setEditSlug(e.target.value)}
											className="h-7 w-36"
										/>
									) : (
										cat.slug
									)}
								</td>
								<td className="py-3 pr-4 text-muted-foreground">
									{cat.parentName ?? <span className="text-xs">—</span>}
								</td>
								<td className="py-3 pr-4">
									<Badge variant="secondary">{cat.childCount}</Badge>
								</td>
								<td className="py-3">
									{editId === cat.id ? (
										<div className="flex gap-1">
											<Button
												size="sm"
												onClick={() => updateCategory(cat.id)}
												disabled={loading === cat.id}
											>
												Save
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => setEditId(null)}
											>
												Cancel
											</Button>
										</div>
									) : (
										<div className="flex gap-1">
											<Button
												size="sm"
												variant="outline"
												onClick={() => startEdit(cat)}
											>
												Edit
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => deleteCategory(cat.id)}
												disabled={loading === cat.id}
											>
												<Trash2 className="size-3.5" aria-hidden />
											</Button>
										</div>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Vehicles tab
// ----------------------------------------------------------------------------

function VehiclesTab({
	vehicles,
	onRefresh,
}: {
	vehicles: AdminVehicle[];
	onRefresh: () => void;
}) {
	const [loading, setLoading] = useState<string | null>(null);
	const [make, setMake] = useState("");
	const [model, setModel] = useState("");
	const [yearStart, setYearStart] = useState("");
	const [yearEnd, setYearEnd] = useState("");
	const [bodyType, setBodyType] = useState("");

	async function addVehicle() {
		if (!make.trim() || !model.trim()) {
			toast.error("Make and model are required");
			return;
		}
		setLoading("add");
		try {
			const res = await fetch("/api/admin/catalog/vehicles", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					make,
					model,
					yearStart: yearStart ? parseInt(yearStart, 10) : null,
					yearEnd: yearEnd ? parseInt(yearEnd, 10) : null,
					bodyType: bodyType || null,
					engine: null,
				}),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Vehicle added");
			setMake("");
			setModel("");
			setYearStart("");
			setYearEnd("");
			setBodyType("");
			onRefresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	async function deleteVehicle(id: string) {
		if (!window.confirm("Delete this vehicle?")) return;
		setLoading(id);
		try {
			const res = await fetch(`/api/admin/catalog/vehicles/${id}`, { method: "DELETE" });
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Vehicle deleted");
			onRefresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	return (
		<div container-id="admin-vehicles" className="flex flex-col gap-4">

			{/* Add form */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-sm">Add vehicle model</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap items-end gap-2">
					{[
						{ label: "Make", value: make, setter: setMake, placeholder: "Toyota" },
						{ label: "Model", value: model, setter: setModel, placeholder: "Corolla" },
						{ label: "Year Start", value: yearStart, setter: setYearStart, placeholder: "2010" },
						{ label: "Year End", value: yearEnd, setter: setYearEnd, placeholder: "2020" },
						{ label: "Body type", value: bodyType, setter: setBodyType, placeholder: "Sedan" },
					].map(({ label, value, setter, placeholder }) => (
						<div key={label} className="flex flex-col gap-1">
							<label className="text-xs text-muted-foreground">{label}</label>
							<Input
								placeholder={placeholder}
								value={value}
								onChange={(e) => setter(e.target.value)}
								className="w-28"
							/>
						</div>
					))}
					<Button
						size="sm"
						onClick={addVehicle}
						disabled={loading === "add" || !make.trim() || !model.trim()}
					>
						<Plus className="size-3.5" aria-hidden />
						Add
					</Button>
				</CardContent>
			</Card>

			{/* Table */}
			<div container-id="admin-vehicles-table" className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border text-left text-xs text-muted-foreground">
							<th className="pb-2 pr-4 font-medium">Make</th>
							<th className="pb-2 pr-4 font-medium">Model</th>
							<th className="pb-2 pr-4 font-medium">Years</th>
							<th className="pb-2 pr-4 font-medium">Body</th>
							<th className="pb-2 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{vehicles.map((v) => (
							<tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
								<td className="py-3 pr-4 font-medium">{v.make}</td>
								<td className="py-3 pr-4">{v.model}</td>
								<td className="py-3 pr-4 text-muted-foreground tabular-nums">
									{v.yearStart ?? "—"}
									{v.yearEnd ? ` – ${v.yearEnd}` : ""}
								</td>
								<td className="py-3 pr-4 text-muted-foreground">{v.bodyType ?? "—"}</td>
								<td className="py-3">
									<Button
										size="sm"
										variant="ghost"
										onClick={() => deleteVehicle(v.id)}
										disabled={loading === v.id}
									>
										<Trash2 className="size-3.5" aria-hidden />
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminCatalogShell({ categories, vehicles }: Props) {
	const router = useRouter();
	const [tab, setTab] = useState<Tab>("categories");

	function refresh() {
		router.refresh();
	}

	return (
		<div container-id="admin-catalog" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-catalog-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
				<p className="text-sm text-muted-foreground">
					{categories.length} categories · {vehicles.length} vehicle models
				</p>
			</header>

			{/* Tab switcher */}
			<div className="flex gap-1 border-b border-border">
				{(["categories", "vehicles"] as const).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
							tab === t
								? "border-b-2 border-primary text-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{t === "categories" ? (
							<Grid3X3 className="size-3.5" aria-hidden />
						) : (
							<Car className="size-3.5" aria-hidden />
						)}
						{t === "categories" ? "Categories" : "Vehicles"}
					</button>
				))}
			</div>

			<Separator />

			{/* Tab content */}
			{tab === "categories" && (
				<CategoriesTab categories={categories} onRefresh={refresh} />
			)}
			{tab === "vehicles" && (
				<VehiclesTab vehicles={vehicles} onRefresh={refresh} />
			)}
		</div>
	);
}

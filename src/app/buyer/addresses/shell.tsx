// ============================================================================
// Buyer Addresses Shell — Client Component
// ============================================================================
//
// Displays all saved addresses as cards. Supports setting default, deleting
// (with confirmation dialog), and navigating to edit or create forms.
// Mutations use React Query hooks and invalidate the addresses list on success.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import type { SavedAddress } from "@/lib/features/addresses";
import {
	useDeleteAddress,
	useSetDefaultAddress,
} from "@/lib/features/addresses";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function ConfirmDeleteDialog({
	address,
	onConfirm,
	onCancel,
	isDeleting,
}: {
	address: SavedAddress;
	onConfirm: () => void;
	onCancel: () => void;
	isDeleting: boolean;
}) {
	return (
		<div
			container-id="delete-confirm-overlay"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		>
			<div
				container-id="delete-confirm-dialog"
				className="mx-4 flex max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-lg"
			>
				<h2 className="text-lg font-semibold">Delete address?</h2>
				<p className="text-sm text-muted-foreground">
					This will permanently delete <strong>{address.label}</strong>. This
					action cannot be undone.
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={onCancel}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						className="flex-1"
						onClick={onConfirm}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting…" : "Delete"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function AddressCard({
	address,
	onDeleteRequest,
}: {
	address: SavedAddress;
	onDeleteRequest: (a: SavedAddress) => void;
}) {
	const router = useRouter();
	const setDefault = useSetDefaultAddress();

	function handleSetDefault() {
		setDefault.mutate(
			{ addressId: address.id },
			{
				onSuccess: () => {
					toast.success("Default address updated");
					router.refresh();
				},
				onError: () => toast.error("Failed to update default"),
			},
		);
	}

	return (
		<Card size="sm" container-id={`address-card-${address.id}`}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapPin className="size-4 shrink-0 text-muted-foreground" />
					{address.label}
					{address.isDefault && (
						<Badge variant="default" className="ml-1">
							Default
						</Badge>
					)}
				</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col gap-1 text-sm">
				<span className="font-medium">{address.fullName}</span>
				<span className="text-muted-foreground">{address.phone}</span>
				<span className="text-muted-foreground">{address.addressLine}</span>
				<span className="text-muted-foreground">
					{address.city}, {address.province}
				</span>
			</CardContent>

			<CardFooter className="flex flex-wrap gap-2">
				<Link
					href={`/buyer/addresses/${address.id}/edit`}
					className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
				>
					Edit
				</Link>

				{!address.isDefault && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleSetDefault}
						disabled={setDefault.isPending}
					>
						<Star className="size-3.5" />
						{setDefault.isPending ? "Setting…" : "Set default"}
					</Button>
				)}

				<Button
					variant="ghost"
					size="sm"
					className="text-destructive hover:text-destructive"
					onClick={() => onDeleteRequest(address)}
				>
					Delete
				</Button>
			</CardFooter>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AddressesShell({
	addresses,
}: {
	addresses: SavedAddress[];
}) {
	const router = useRouter();
	const [toDelete, setToDelete] = useState<SavedAddress | null>(null);
	const deleteAddress = useDeleteAddress();

	function confirmDelete() {
		if (!toDelete) return;
		deleteAddress.mutate(
			{ addressId: toDelete.id },
			{
				onSuccess: () => {
					toast.success("Address deleted");
					setToDelete(null);
					router.refresh();
				},
				onError: () => toast.error("Failed to delete address"),
			},
		);
	}

	return (
		<div
			container-id="addresses-shell"
			className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto gap-6"
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Saved Addresses
					</h1>
					<p className="text-sm text-muted-foreground">
						Manage your delivery addresses.
					</p>
				</div>
				<Link
					href="/buyer/addresses/new"
					className={cn(buttonVariants({ variant: "default" }))}
				>
					<Plus className="size-4" />
					Add address
				</Link>
			</div>

			{/* List */}
			{addresses.length === 0 ? (
				<div
					container-id="addresses-empty"
					className="flex flex-col flex-1 min-h-0 items-center justify-center gap-4 rounded-xl border border-dashed border-muted-foreground/25 py-16"
				>
					<MapPin className="size-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No saved addresses</p>
					<Link
						href="/buyer/addresses/new"
						className={cn(buttonVariants({ variant: "outline" }))}
					>
						Add your first address
					</Link>
				</div>
			) : (
				<div
					container-id="addresses-list"
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				>
					{addresses.map((address) => (
						<AddressCard
							key={address.id}
							address={address}
							onDeleteRequest={setToDelete}
						/>
					))}
				</div>
			)}

			{/* Delete confirmation */}
			{toDelete && (
				<ConfirmDeleteDialog
					address={toDelete}
					onConfirm={confirmDelete}
					onCancel={() => setToDelete(null)}
					isDeleting={deleteAddress.isPending}
				/>
			)}
		</div>
	);
}

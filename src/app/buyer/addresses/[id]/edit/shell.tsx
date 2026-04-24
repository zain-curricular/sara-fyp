// ============================================================================
// Edit Address Shell — Client Component
// ============================================================================
//
// Pre-fills the address form with existing address data. On success redirects
// to /buyer/addresses.

"use client";

import type { SavedAddress } from "@/lib/features/addresses";
import { AddressForm } from "../../_components/address-form";

export default function EditAddressShell({
	address,
}: {
	address: SavedAddress;
}) {
	return (
		<div
			container-id="edit-address-shell"
			className="flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Edit address
				</h1>
				<p className="text-sm text-muted-foreground">
					Update the details for <strong>{address.label}</strong>.
				</p>
			</header>

			<AddressForm mode="edit" address={address} />
		</div>
	);
}

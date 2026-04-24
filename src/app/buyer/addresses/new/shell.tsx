// ============================================================================
// New Address Shell — Client Component
// ============================================================================
//
// Renders the address creation form. On success the form redirects to
// /buyer/addresses.

"use client";

import { AddressForm } from "../_components/address-form";

export default function NewAddressShell() {
	return (
		<div
			container-id="new-address-shell"
			className="flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Add address
				</h1>
				<p className="text-sm text-muted-foreground">
					Save a delivery address to use at checkout.
				</p>
			</header>

			<AddressForm mode="create" />
		</div>
	);
}

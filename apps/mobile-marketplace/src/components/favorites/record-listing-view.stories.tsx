"use client";

// =============================================================================
// RecordListingView — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RecordListingView } from "@/components/favorites/record-listing-view";
import { mockListingId } from "@/storybook/fixtures";

const meta = {
	component: RecordListingView,
	args: {
		listingId: mockListingId,
	},
} satisfies Meta<typeof RecordListingView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Effect-only: POSTs a view event when signed in; no visible UI. */
export const Default: Story = {
	render: (args) => (
		<div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
			<RecordListingView {...args} />
			<p>No visible output — open Actions / console to verify behavior in a wired app.</p>
		</div>
	),
};

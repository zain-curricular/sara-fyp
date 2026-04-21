// =============================================================================
// ListingSpecsTable — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListingSpecsTable } from "@/components/listings/listing-specs-table";
import { mockListing, mockListingWithSpecs } from "@/storybook/fixtures";

const meta = {
	component: ListingSpecsTable,
} satisfies Meta<typeof ListingSpecsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSpecs: Story = {
	args: {
		listing: mockListingWithSpecs,
	},
};

export const Empty: Story = {
	args: {
		listing: mockListing,
	},
};

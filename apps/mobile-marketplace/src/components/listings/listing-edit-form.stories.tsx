"use client";

// =============================================================================
// ListingEditForm — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListingEditForm } from "@/components/listings/listing-edit-form";
import { mockCategories, mockListing } from "@/storybook/fixtures";

const meta = {
	component: ListingEditForm,
	args: {
		listing: mockListing,
		categories: mockCategories,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: `/seller/listings/${mockListing.id}/edit` },
		},
	},
} satisfies Meta<typeof ListingEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

"use client";

// =============================================================================
// CreateListingWizard — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreateListingWizard } from "@/components/listings/create-listing-wizard";
import { mockCategories } from "@/storybook/fixtures";

const meta = {
	component: CreateListingWizard,
	args: {
		categories: mockCategories,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/seller/listings/new" },
		},
	},
} satisfies Meta<typeof CreateListingWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

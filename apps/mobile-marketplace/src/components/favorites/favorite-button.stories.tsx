"use client";

// =============================================================================
// FavoriteButton — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { mockListingId } from "@/storybook/fixtures";

const meta = {
	component: FavoriteButton,
	args: {
		listingId: mockListingId,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/listings/demo" },
		},
	},
} satisfies Meta<typeof FavoriteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Resolves signed-out or session state from Supabase; heart enables after load. */
export const Default: Story = {};

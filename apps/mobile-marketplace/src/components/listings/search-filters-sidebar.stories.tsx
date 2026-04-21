"use client";

// =============================================================================
// SearchFiltersSidebar — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchFiltersSidebar } from "@/components/listings/search-filters-sidebar";
import { mockSearchInitial } from "@/storybook/fixtures";

const meta = {
	component: SearchFiltersSidebar,
	args: {
		initial: mockSearchInitial,
		basePath: "/search",
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/search" },
		},
	},
} satisfies Meta<typeof SearchFiltersSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

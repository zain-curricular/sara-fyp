// =============================================================================
// FilterChips — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterChips } from "@/components/listings/filter-chips";
import { mockFilterChips } from "@/storybook/fixtures";

const meta = {
	component: FilterChips,
	args: {
		chips: mockFilterChips,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/search" },
		},
	},
} satisfies Meta<typeof FilterChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

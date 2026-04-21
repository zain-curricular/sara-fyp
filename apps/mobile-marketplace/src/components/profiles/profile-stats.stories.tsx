// =============================================================================
// ProfileStats — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileStats } from "@/components/profiles/profile-stats";
import { mockProfileStats } from "@/storybook/fixtures";

const meta = {
	component: ProfileStats,
	args: {
		stats: mockProfileStats,
	},
} satisfies Meta<typeof ProfileStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

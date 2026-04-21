// =============================================================================
// Badge — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/components/primitives/badge";

const meta = {
	component: Badge,
	args: {
		children: "Badge",
	},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
	args: { variant: "secondary" },
};

export const Outline: Story = {
	args: { variant: "outline" },
};

export const Destructive: Story = {
	args: { variant: "destructive" },
};

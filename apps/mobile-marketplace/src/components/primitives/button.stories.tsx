// =============================================================================
// Button — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Button } from "@/components/primitives/button";

const meta = {
	component: Button,
	args: {
		children: "Button",
		onClick: fn(),
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
	args: { variant: "outline" },
};

export const Secondary: Story = {
	args: { variant: "secondary" },
};

export const Destructive: Story = {
	args: { variant: "destructive" },
};

export const Disabled: Story = {
	args: { disabled: true },
};

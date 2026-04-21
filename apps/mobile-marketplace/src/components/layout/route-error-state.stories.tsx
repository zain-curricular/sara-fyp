"use client";

// =============================================================================
// RouteErrorState — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { RouteErrorState } from "@/components/layout/route-error-state";

const meta = {
	component: RouteErrorState,
	args: {
		title: "Something went wrong",
		description: "Check your connection and try again.",
		error: Object.assign(new Error("Example error"), { digest: "demo-digest" }),
		reset: fn(),
	},
} satisfies Meta<typeof RouteErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

"use client";

// =============================================================================
// ReviewStars — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReviewStars } from "@/components/reviews/review-stars";

const meta = {
	component: ReviewStars,
} satisfies Meta<typeof ReviewStars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
	args: {
		value: 4,
		readOnly: true,
	},
};

export const Interactive: Story = {
	args: {
		value: 0,
		readOnly: false,
		onChange: fn(),
	},
};

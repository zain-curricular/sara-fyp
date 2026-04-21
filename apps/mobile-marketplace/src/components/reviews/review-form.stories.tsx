"use client";

// =============================================================================
// ReviewForm — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewForm } from "@/components/reviews/review-form";
import { mockOrderId } from "@/storybook/fixtures";

const meta = {
	component: ReviewForm,
	args: {
		orderId: mockOrderId,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: `/buyer/orders/${mockOrderId}/review` },
		},
	},
} satisfies Meta<typeof ReviewForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

"use client";

// =============================================================================
// ReviewsList — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewsList } from "@/components/reviews/reviews-list";
import { mockSellerReviewsBundle, mockSellerReviewsEmpty, mockUserId } from "@/storybook/fixtures";

const meta = {
	component: ReviewsList,
	args: {
		sellerId: mockUserId,
		initial: mockSellerReviewsBundle,
	},
} satisfies Meta<typeof ReviewsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReviews: Story = {};

export const Empty: Story = {
	args: {
		initial: mockSellerReviewsEmpty,
		emptyMessage: "No reviews yet for this seller.",
	},
};

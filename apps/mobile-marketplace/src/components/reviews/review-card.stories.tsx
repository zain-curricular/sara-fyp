// =============================================================================
// ReviewCard — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewCard } from "@/components/reviews/review-card";
import { mockReview, mockReviewNoComment } from "@/storybook/fixtures";

const meta = {
	component: ReviewCard,
} satisfies Meta<typeof ReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithComment: Story = {
	args: {
		review: mockReview,
	},
};

export const NoComment: Story = {
	args: {
		review: mockReviewNoComment,
	},
};

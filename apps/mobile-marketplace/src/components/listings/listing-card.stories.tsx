// =============================================================================
// ListingCard — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListingCard } from "@/components/listings/listing-card";
import { mockListing } from "@/storybook/fixtures";

const meta = {
	component: ListingCard,
	args: {
		listing: mockListing,
	},
	decorators: [
		(Story) => (
			<div className="max-w-sm">
				<Story />
			</div>
		),
	],
	parameters: {
		nextjs: {
			navigation: { pathname: "/search" },
		},
	},
} satisfies Meta<typeof ListingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

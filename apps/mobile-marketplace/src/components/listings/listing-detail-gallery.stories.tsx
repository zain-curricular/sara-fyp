// =============================================================================
// ListingDetailGallery — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListingDetailGallery } from "@/components/listings/listing-detail-gallery";
import { mockListing, mockListingImages } from "@/storybook/fixtures";

const meta = {
	component: ListingDetailGallery,
} satisfies Meta<typeof ListingDetailGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhotos: Story = {
	args: {
		images: mockListingImages,
		title: mockListing.title,
	},
};

export const Empty: Story = {
	args: {
		images: [],
		title: mockListing.title,
	},
};

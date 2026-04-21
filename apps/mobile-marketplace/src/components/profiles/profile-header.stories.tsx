// =============================================================================
// ProfileHeader — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileHeader } from "@/components/profiles/profile-header";
import { mockProfileHeader } from "@/storybook/fixtures";

const meta = {
	component: ProfileHeader,
	args: {
		profile: mockProfileHeader,
	},
} satisfies Meta<typeof ProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unverified: Story = {
	args: {
		profile: {
			...mockProfileHeader,
			is_verified: false,
		},
	},
};

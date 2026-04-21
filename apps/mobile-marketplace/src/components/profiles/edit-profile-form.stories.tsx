"use client";

// =============================================================================
// EditProfileForm — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EditProfileForm } from "@/components/profiles/edit-profile-form";
import { mockOwnProfile } from "@/storybook/fixtures";

const meta = {
	component: EditProfileForm,
	args: {
		profile: mockOwnProfile,
	},
	parameters: {
		nextjs: {
			navigation: { pathname: "/buyer/profile" },
		},
	},
} satisfies Meta<typeof EditProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

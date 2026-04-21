// =============================================================================
// SiteHeader — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteHeader } from "@/components/layout/site-header";

const meta = {
	component: SiteHeader,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			navigation: { pathname: "/" },
		},
	},
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

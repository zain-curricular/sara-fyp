// =============================================================================
// AppShell — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppShell } from "@/components/layout/app-shell";

const meta = {
	component: AppShell,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			navigation: { pathname: "/" },
		},
	},
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<AppShell>
			<p className="text-sm text-muted-foreground">Page content area inside the shared header and footer.</p>
		</AppShell>
	),
};

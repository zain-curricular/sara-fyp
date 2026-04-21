// =============================================================================
// Separator — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Separator } from "@/components/primitives/separator";

const meta = {
	component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
	render: () => (
		<div className="w-64 space-y-2">
			<p className="text-sm">Section A</p>
			<Separator />
			<p className="text-sm">Section B</p>
		</div>
	),
};

export const Vertical: Story = {
	render: () => (
		<div className="flex h-16 items-stretch gap-4">
			<span className="text-sm">Left</span>
			<Separator orientation="vertical" />
			<span className="text-sm">Right</span>
		</div>
	),
};

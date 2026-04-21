// =============================================================================
// Label — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";

const meta = {
	component: Label,
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex w-64 flex-col gap-2">
			<Label htmlFor="sb-label-demo">Display name</Label>
			<Input id="sb-label-demo" placeholder="Your name" />
		</div>
	),
};

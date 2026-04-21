// =============================================================================
// Textarea — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Label } from "@/components/primitives/label";
import { Textarea } from "@/components/primitives/textarea";

const meta = {
	component: Textarea,
	args: {
		placeholder: "Describe the item condition…",
		rows: 4,
	},
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
	render: (args) => (
		<div className="flex w-full max-w-md flex-col gap-2">
			<Label htmlFor="sb-textarea">Description</Label>
			<Textarea id="sb-textarea" {...args} />
		</div>
	),
};

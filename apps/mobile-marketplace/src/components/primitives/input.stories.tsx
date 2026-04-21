// =============================================================================
// Input — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";

const meta = {
	component: Input,
	decorators: [
		(Story) => (
			<div className="flex w-72 flex-col gap-2">
				<Story />
			</div>
		),
	],
	args: {
		placeholder: "Search listings…",
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
	render: (args) => (
		<>
			<Label htmlFor="sb-input">Label</Label>
			<Input id="sb-input" {...args} />
		</>
	),
};

export const Invalid: Story = {
	args: { "aria-invalid": true },
};

"use client";

// =============================================================================
// Select — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Label } from "@/components/primitives/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";

const meta = {
	component: SelectTrigger,
	decorators: [
		(Story) => (
			<div className="w-72">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SelectTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex flex-col gap-2">
			<Label id="sb-select-label">Condition</Label>
			<Select defaultValue="good">
				<SelectTrigger aria-labelledby="sb-select-label">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="new">New</SelectItem>
					<SelectItem value="good">Good</SelectItem>
					<SelectItem value="fair">Fair</SelectItem>
				</SelectContent>
			</Select>
		</div>
	),
};

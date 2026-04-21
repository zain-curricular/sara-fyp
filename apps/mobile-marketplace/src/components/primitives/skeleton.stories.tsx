// =============================================================================
// Skeleton — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "@/components/primitives/skeleton";

const meta = {
	component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex w-64 flex-col gap-2">
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-24 w-full rounded-xl" />
		</div>
	),
};

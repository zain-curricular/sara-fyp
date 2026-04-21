// =============================================================================
// Avatar — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";

const meta = {
	component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
	render: () => (
		<Avatar className="size-16">
			<AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop" alt="" />
			<AvatarFallback>SK</AvatarFallback>
		</Avatar>
	),
};

export const FallbackOnly: Story = {
	render: () => (
		<Avatar className="size-16">
			<AvatarFallback>SK</AvatarFallback>
		</Avatar>
	),
};

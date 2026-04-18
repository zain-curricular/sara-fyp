import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import HomeShell from "./shell";

const meta = {
	title: "Pages/Public/Home",
	component: HomeShell,
} satisfies Meta<typeof HomeShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

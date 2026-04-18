import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import LoginShell from "./shell";

const meta = {
	title: "Pages/Auth/Login",
	component: LoginShell,
} satisfies Meta<typeof LoginShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SignInShell from "../sign-in/shell";

const meta = {
	title: "Pages/Auth/Sign in",
	component: SignInShell,
} satisfies Meta<typeof SignInShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

"use client";

// =============================================================================
// ImageDropzone — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ImageDropzone } from "@/components/listings/image-dropzone";

const meta = {
	component: ImageDropzone,
	args: {
		onFile: fn(),
	},
} satisfies Meta<typeof ImageDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};

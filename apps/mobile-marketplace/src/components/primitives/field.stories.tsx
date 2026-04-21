"use client";

// =============================================================================
// Field — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/primitives/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";

const meta = {
	component: Field,
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<FieldSet className="max-w-md">
			<FieldLegend>Account</FieldLegend>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="sb-field-email">Email</FieldLabel>
					<Input id="sb-field-email" type="email" placeholder="you@example.com" />
					<FieldDescription>We never share your email.</FieldDescription>
				</Field>
				<FieldSeparator />
				<Field data-invalid>
					<FieldLabel htmlFor="sb-field-phone">Phone</FieldLabel>
					<Input id="sb-field-phone" aria-invalid placeholder="+92…" />
					<FieldError>Enter a valid phone number.</FieldError>
				</Field>
			</FieldGroup>
			<div className="mt-4 flex justify-end">
				<Button type="button" size="sm">
					Save
				</Button>
			</div>
		</FieldSet>
	),
};

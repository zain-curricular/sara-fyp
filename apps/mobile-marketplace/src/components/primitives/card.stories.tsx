// =============================================================================
// Card — Storybook
// =============================================================================

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/primitives/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/primitives/card";

const meta = {
	component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Listing summary</CardTitle>
				<CardDescription>Price, condition, and location at a glance.</CardDescription>
				<CardAction>
					<Button size="sm" variant="outline">
						Share
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">Card body content goes here.</p>
			</CardContent>
			<CardFooter className="justify-end gap-2">
				<Button variant="outline" size="sm">
					Cancel
				</Button>
				<Button size="sm">Save</Button>
			</CardFooter>
		</Card>
	),
};

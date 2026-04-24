import type { Preview } from "@storybook/nextjs-vite";

import { AppProviders } from "@/lib/providers/app-providers";

import "../src/app/globals.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		nextjs: {
			appDirectory: true,
		},
		a11y: {
			test: "todo",
		},
	},
	decorators: [
		(Story) => (
			<AppProviders>
				<div className="bg-background text-foreground antialiased font-sans">
					<Story />
				</div>
			</AppProviders>
		),
	],
};

export default preview;

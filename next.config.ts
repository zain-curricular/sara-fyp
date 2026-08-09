import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

import { deriveSupabaseApiUrlFromEnv } from "./src/lib/supabase/derive-api-url";

const appRoot =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

loadEnvConfig(appRoot);

const resolvedSupabaseUrl = deriveSupabaseApiUrlFromEnv(process.env);

// Hosts that `next/image` is allowed to optimize. `loremflickr.com` serves the
// seeded listing/store photos; `127.0.0.1` covers images served from local
// Supabase Storage once the images-to-Storage backfill runs.
const supabaseImageHost = (() => {
	try {
		return resolvedSupabaseUrl ? new URL(resolvedSupabaseUrl) : null;
	} catch {
		return null;
	}
})();

const nextConfig: NextConfig = {
	...(resolvedSupabaseUrl
		? { env: { NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl } }
		: {}),
	allowedDevOrigins: ["127.0.0.1"],
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "loremflickr.com" },
			{ protocol: "https", hostname: "*.supabase.co" },
			...(supabaseImageHost
				? [
						{
							protocol: supabaseImageHost.protocol.replace(":", "") as "http" | "https",
							hostname: supabaseImageHost.hostname,
							port: supabaseImageHost.port || undefined,
						},
					]
				: [{ protocol: "http" as const, hostname: "127.0.0.1" }]),
		],
	},
};

export default nextConfig;

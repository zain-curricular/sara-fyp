import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

import { deriveSupabaseApiUrlFromEnv } from "./src/lib/supabase/derive-api-url";

const appRoot =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

loadEnvConfig(appRoot);

const resolvedSupabaseUrl = deriveSupabaseApiUrlFromEnv(process.env);

// Hosts that `next/image` is allowed to optimize:
//   * loremflickr.com — seeded CDN photos (bare `db reset`, online)
//   * local Supabase Storage — 127.0.0.1 / localhost on the API port, populated
//     by `npm run seed:images` (offline demo). Next matches the port exactly, so
//     it must be listed explicitly (a port-less entry would not match :55321).
//   * *.supabase.co — hosted Storage, if ever pointed at a cloud project.
const supabaseImageHost = (() => {
	try {
		return resolvedSupabaseUrl ? new URL(resolvedSupabaseUrl) : null;
	} catch {
		return null;
	}
})();

const localStoragePort = supabaseImageHost?.port || "55321";

const nextConfig: NextConfig = {
	...(resolvedSupabaseUrl
		? { env: { NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl } }
		: {}),
	allowedDevOrigins: ["127.0.0.1"],
	images: {
		// The built-in optimizer refuses to fetch loopback hosts (127.0.0.1 /
		// localhost) for SSRF safety, so local Supabase Storage images can't be
		// optimized in dev. Disable optimization in development only — the browser
		// then loads Storage/CDN images directly. Production (cloud Supabase over
		// *.supabase.co) still optimizes via the remotePatterns below.
		unoptimized: process.env.NODE_ENV === "development",
		remotePatterns: [
			{ protocol: "https", hostname: "loremflickr.com" },
			{ protocol: "https", hostname: "*.supabase.co" },
			{ protocol: "http", hostname: "127.0.0.1", port: localStoragePort },
			{ protocol: "http", hostname: "localhost", port: localStoragePort },
		],
	},
};

export default nextConfig;

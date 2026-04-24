import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

import { deriveSupabaseApiUrlFromEnv } from "./src/lib/supabase/derive-api-url";

const appRoot =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/** npm workspace root (repo root) — so Turbopack resolves `next` from hoisted `node_modules`. */
const workspaceRoot = path.resolve(appRoot, "../..");

/** Load repo-root then app `.env*` (Next's default is app dir only when cwd is the app). */
loadEnvConfig(workspaceRoot);
loadEnvConfig(appRoot);

const resolvedSupabaseUrl = deriveSupabaseApiUrlFromEnv(process.env);

const nextConfig: NextConfig = {
	...(resolvedSupabaseUrl
		? { env: { NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl } }
		: {}),
	allowedDevOrigins: ["127.0.0.1"],
	turbopack: {
		root: workspaceRoot,
	},
};

export default nextConfig;

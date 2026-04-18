import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const appRoot =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/** npm workspace root (repo root) — so Turbopack resolves `next` from hoisted `node_modules`. */
const workspaceRoot = path.resolve(appRoot, "../..");

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	turbopack: {
		root: workspaceRoot,
	},
};

export default nextConfig;

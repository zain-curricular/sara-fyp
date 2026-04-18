/** Shared base URL for the deployed marketplace API (`NEXT_PUBLIC_API_URL`). */
export function getMarketplaceApiOrigin(): string | null {
	const raw = process.env.NEXT_PUBLIC_API_URL;
	if (!raw) {
		return null;
	}
	return raw.replace(/\/$/, "");
}

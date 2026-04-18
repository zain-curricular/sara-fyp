import "server-only";

/** Server barrel for marketplace feature — add DAFs and services here. */

export async function marketplaceHealthPing(): Promise<{ ok: true }> {
	return { ok: true };
}

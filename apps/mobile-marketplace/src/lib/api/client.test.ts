import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "./client";

describe("apiFetch", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.NEXT_PUBLIC_API_URL;
	});

	it("throws when NEXT_PUBLIC_API_URL is unset", async () => {
		await expect(apiFetch("/x")).rejects.toThrow(/NEXT_PUBLIC_API_URL is not set/);
	});

	it("requests the backend base URL", async () => {
		process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ hello: "world" }),
		});
		vi.stubGlobal("fetch", fetchMock);

		const result = await apiFetch<{ hello: string }>("/v1/ping");

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/v1/ping",
			expect.objectContaining({
				headers: expect.any(Headers),
			}),
		);
		expect(result).toEqual({ hello: "world" });
	});

	it("maps failed responses to ApiError", async () => {
		process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Server Error",
				text: async () => "nope",
			}),
		);

		await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
	});
});

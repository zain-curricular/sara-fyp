import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch, apiFetchFormData } from "./client";

describe("apiFetch", () => {
	beforeEach(() => {
		vi.stubGlobal("window", undefined);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.NEXT_PUBLIC_API_URL;
	});

	it("throws when API base URL is unset", async () => {
		await expect(apiFetch("/x")).rejects.toThrow(/Marketplace API base URL is not configured/);
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

describe("apiFetchFormData", () => {
	beforeEach(() => {
		vi.stubGlobal("window", undefined);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.NEXT_PUBLIC_API_URL;
	});

	it("throws when API base URL is unset", async () => {
		const fd = new FormData();
		await expect(apiFetchFormData("/x", fd)).rejects.toThrow(/Marketplace API base URL is not configured/);
	});

	it("POSTs FormData without setting Content-Type (boundary preserved)", async () => {
		process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ ok: true }),
		});
		vi.stubGlobal("fetch", fetchMock);

		const fd = new FormData();
		fd.append("file", new Blob(["x"], { type: "image/png" }), "a.png");

		await apiFetchFormData<{ ok: boolean }>("/api/upload", fd, {
			accessToken: "tok",
		});

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(init.body).toBe(fd);
		const headers = init.headers as Headers;
		expect(headers.get("Authorization")).toBe("Bearer tok");
		expect(headers.get("Content-Type")).toBeNull();
	});
});

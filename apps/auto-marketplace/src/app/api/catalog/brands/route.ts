import { NextResponse } from "next/server";

import { listBrandsByPlatform } from "@/lib/features/product-catalog/services";

export async function GET() {
	try {
		const { data, error } = await listBrandsByPlatform("automotive");
		if (error) {
			return NextResponse.json({ ok: false, error: "Failed to load brands" }, { status: 500 });
		}
		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
	} catch (error) {
		console.error("UNEXPECTED: GET /api/catalog/brands", error);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}

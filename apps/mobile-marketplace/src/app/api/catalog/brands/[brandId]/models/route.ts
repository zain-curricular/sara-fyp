import { NextResponse } from "next/server";

import { catalogUuidParamSchema } from "@/lib/features/product-catalog/schemas";
import { listActiveModelsByBrandId } from "@/lib/features/product-catalog/services";

export async function GET(
	_request: Request,
	context: { params: Promise<{ brandId: string }> },
) {
	try {
		const { brandId } = await context.params;
		const parsed = catalogUuidParamSchema.safeParse(brandId);
		if (!parsed.success) {
			return NextResponse.json({ ok: false, error: "Invalid query parameters" }, { status: 400 });
		}

		const { data, error } = await listActiveModelsByBrandId(parsed.data);
		if (error) {
			return NextResponse.json({ ok: false, error: "Failed to load models" }, { status: 500 });
		}
		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
	} catch (error) {
		console.error("UNEXPECTED: GET /api/catalog/brands/[brandId]/models", error);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}

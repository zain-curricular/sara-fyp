import { NextResponse } from "next/server";

import { catalogUuidParamSchema } from "@/lib/features/product-catalog/schemas";
import { getModelVariants } from "@/lib/features/product-catalog/services";

export async function GET(
	_request: Request,
	context: { params: Promise<{ modelId: string }> },
) {
	try {
		const { modelId } = await context.params;
		const parsed = catalogUuidParamSchema.safeParse(modelId);
		if (!parsed.success) {
			return NextResponse.json({ ok: false, error: "Invalid query parameters" }, { status: 400 });
		}

		const { data, error } = await getModelVariants(parsed.data);
		if (error) {
			return NextResponse.json({ ok: false, error: "Failed to load variants" }, { status: 500 });
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		return NextResponse.json({ ok: true, data }, { status: 200 });
	} catch (error) {
		console.error("UNEXPECTED: GET /api/catalog/models/[modelId]/variants", error);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}

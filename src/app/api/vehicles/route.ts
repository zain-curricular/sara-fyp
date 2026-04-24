// ============================================================================
// GET /api/vehicles — list all vehicles
// ============================================================================
//
// Public endpoint. Returns all vehicles from the vehicles table for use in
// mechanic verification request vehicle selectors. No auth required.
//
// Table: vehicles (id, make, model, year_from, year_to)

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type VehicleRow = {
	id: string;
	make: string;
	model: string;
	yearFrom: number;
	yearTo: number;
};

export async function GET(): Promise<NextResponse> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("vehicles")
		.select("id, make, model, year_from, year_to")
		.order("make", { ascending: true })
		.order("model", { ascending: true });

	if (error) {
		console.error("[GET /api/vehicles]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load vehicles" },
			{ status: 500 },
		);
	}

	const vehicles: VehicleRow[] = (data ?? []).map((r) => {
		const row = r as Record<string, unknown>;
		return {
			id: row.id as string,
			make: row.make as string,
			model: row.model as string,
			yearFrom: row.year_from as number,
			yearTo: row.year_to as number,
		};
	});

	return NextResponse.json({ ok: true, data: vehicles });
}

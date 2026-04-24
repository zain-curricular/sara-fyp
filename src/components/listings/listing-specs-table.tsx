import type { ListingRecord } from "@/lib/features/listings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ListingSpecsTableProps = {
	listing: ListingRecord;
};

/** Renders `details` JSON as a simple key/value grid (part specs: OEM number, fitment, etc.). */
export function ListingSpecsTable({ listing }: ListingSpecsTableProps) {
	const entries = Object.entries(listing.details ?? {}).filter(
		([, v]) => v !== undefined && v !== null && String(v).length > 0,
	);

	if (!entries.length) {
		return (
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Specs</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">No extra specs provided.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card size="sm" container-id="listing-specs-card">
			<CardHeader>
				<CardTitle className="text-base">Specs</CardTitle>
			</CardHeader>
			<CardContent>
				<dl
					container-id="listing-specs-grid"
					className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
				>
					{entries.map(([key, value]) => (
						<div key={key} className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
							<dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
								{key.replace(/_/g, " ")}
							</dt>
							<dd className="text-sm font-medium">{String(value)}</dd>
						</div>
					))}
				</dl>
			</CardContent>
		</Card>
	);
}

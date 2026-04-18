import type { ListingRecord } from "@/lib/features/listings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ListingSpecsTableProps = {
	listing: ListingRecord;
};

/** Renders `details` JSON as a simple key/value grid (phone specs: IMEI, storage, etc.). */
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
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Specs</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{entries.map(([key, value]) => (
						<div key={key} className="flex flex-col gap-0.5">
							<dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								{key.replace(/_/g, " ")}
							</dt>
							<dd className="text-sm">{String(value)}</dd>
						</div>
					))}
				</dl>
			</CardContent>
		</Card>
	);
}

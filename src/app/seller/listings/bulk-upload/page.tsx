// ============================================================================
// Bulk Upload Page
// ============================================================================
//
// RSC wrapper — no server-side data needed. All work is client-side.

import BulkUploadShell from "./shell";

export const metadata = { title: "Bulk Upload — ShopSmart Seller" };

export default function BulkUploadPage() {
	return <BulkUploadShell />;
}

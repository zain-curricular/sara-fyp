// ============================================================================
// Device testing — public read surface for other features (no heavy services)
// ============================================================================
//
// Other features must not import `_data-access/*` directly. This module only
// re-exports read DAFs to avoid circular imports with `orders` ↔ device-testing.

import 'server-only'

export { getTestReportByOrderId } from './_data-access/reportsDafs'

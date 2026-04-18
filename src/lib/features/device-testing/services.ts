// ============================================================================
// Device testing — server barrel
// ============================================================================

import 'server-only'

export {
	authenticateAndAuthorizeAdmin,
	authenticateAndAuthorizeTester,
} from './_auth/testingAuth'
export { assignOrderToTester } from './_utils/assignmentService'
export {
	addPhotoToReport,
	createTestReport,
	listTesterQueue,
	submitTestReport,
	updateTestReportDraft,
} from './_utils/testReportWriteService'
export { getTestReportByOrderId } from './_data-access/reportsDafs'
export {
	createTestReportBodySchema,
	patchTestReportBodySchema,
	submitTestReportBodySchema,
	assignTesterBodySchema,
} from './schemas'
export { validateInspectionResultsAgainstSchema } from './_utils/validateInspectionResults'

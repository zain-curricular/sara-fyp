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
	submitTestReport,
	updateTestReportDraft,
} from './_utils/testReportWriteService'
export { listOrdersForAssignedTester } from './_data-access/assignmentDafs'
export { getTestReportByOrderId } from './orderReads'
export {
	createTestReportBodySchema,
	patchTestReportBodySchema,
	submitTestReportBodySchema,
	assignTesterBodySchema,
} from './schemas'
export { validateInspectionResultsAgainstSchema } from './_utils/validateInspectionResults'
export {
	addPhotoErrorToHttp,
	assignTesterErrorToHttp,
	createTestReportErrorToHttp,
	patchTestReportErrorToHttp,
	submitTestReportErrorToHttp,
} from './_utils/deviceTestingApiHttp'

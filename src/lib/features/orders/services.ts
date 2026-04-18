// ============================================================================
// Orders — server barrel
// ============================================================================

import 'server-only'

export type { OrderDetailPayload } from './_utils/orderReadService'
export type { OrderRow } from './_data-access/ordersEscrowDafs'

export {
	getEscrowTransactionById,
	getOrderById,
	insertOrderEscrowTransaction,
	listEscrowTransactionsForOrder,
	listOrdersByListingId,
	listOrdersForUser,
	updateEscrowTransactionById,
} from './_data-access/ordersEscrowDafs'

export { getOrderDetailForParticipant, listOrdersForCurrentUser } from './_utils/orderReadService'
export { initiateOrderPaymentForBuyer } from './_utils/initiateOrderPayment'
export { applyOrderPaymentWebhook } from './_utils/orderPaymentWebhookService'
export { verifyOrderPaymentWebhookSecret } from './_utils/orderWebhookAuth'
export type {
	TransitionOrderForParticipantError,
	TransitionOrderForParticipantResult,
} from './_utils/orderTransitionService'
export { transitionOrderForParticipant } from './_utils/orderTransitionService'
export {
	orderPaymentWebhookErrorToHttp,
	transitionOrderOutcomeToHttpPayload,
} from './_utils/orderApiHttp'
export {
	parseTransitionOrderRpcPayload,
	transitionOrderWithServiceRole,
	transitionOrderWithUserJwt,
} from './_utils/transitionOrderRpc'

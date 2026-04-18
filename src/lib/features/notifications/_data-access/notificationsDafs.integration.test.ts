// ============================================================================
// DAL integration tests — notificationsDafs
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getAdmin } from '@/lib/supabase/clients/adminClient'

import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import {
	bulkMarkAllReadForUser,
	countUnreadNotificationsForUser,
	listNotificationsForUser,
	updateNotificationReadForUser,
} from './notificationsDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('notificationsDafs', () => {
	let fx: CatalogApiFixture
	const notificationIds: string[] = []

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()

		const { data: n1, error: e1 } = await admin
			.from('notifications')
			.insert({
				user_id: fx.regularUserId,
				type: 'new_message',
				title: 'Integration test 1',
				body: null,
			})
			.select('id')
			.single()
		if (e1 || !n1) {
			throw new Error(`seed notification 1: ${JSON.stringify(e1)}`)
		}
		notificationIds.push(n1.id as string)

		const { data: n2, error: e2 } = await admin
			.from('notifications')
			.insert({
				user_id: fx.regularUserId,
				type: 'outbid',
				title: 'Integration test 2',
				body: null,
			})
			.select('id')
			.single()
		if (e2 || !n2) {
			throw new Error(`seed notification 2: ${JSON.stringify(e2)}`)
		}
		notificationIds.push(n2.id as string)

		const { error: e3 } = await admin.from('notifications').insert({
			user_id: fx.adminUserId,
			type: 'order_status',
			title: 'Other user',
			body: null,
		})
		if (e3) {
			throw new Error(`seed notification other user: ${JSON.stringify(e3)}`)
		}
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('notifications').delete().eq('user_id', fx.regularUserId)
		await admin.from('notifications').delete().eq('user_id', fx.adminUserId)
		await cleanupCatalogApiFixture(fx)
	})

	it('countUnreadNotificationsForUser is scoped to user_id', async () => {
		const { count, error } = await countUnreadNotificationsForUser(fx.regularUserId)
		expect(error).toBeNull()
		expect(count).toBeGreaterThanOrEqual(2)
	})

	it('listNotificationsForUser returns rows for user', async () => {
		const { data, error, pagination } = await listNotificationsForUser(fx.regularUserId, {
			limit: 10,
			offset: 0,
			unreadFirst: false,
		})
		expect(error).toBeNull()
		expect(data?.length).toBeGreaterThanOrEqual(2)
		expect(pagination.total).toBeGreaterThanOrEqual(2)
	})

	it('bulkMarkAllReadForUser returns marked count without row payload', async () => {
		const { marked, error } = await bulkMarkAllReadForUser(fx.regularUserId)
		expect(error).toBeNull()
		expect(marked).toBeGreaterThanOrEqual(2)

		const { count } = await countUnreadNotificationsForUser(fx.regularUserId)
		expect(count).toBe(0)
	})

	it('updateNotificationReadForUser is idempotent for already-read rows', async () => {
		const admin = getAdmin()
		const { data: row, error: insErr } = await admin
			.from('notifications')
			.insert({
				user_id: fx.regularUserId,
				type: 'price_drop',
				title: 'Idempotent test',
				body: null,
			})
			.select('id')
			.single()
		if (insErr || !row) {
			throw new Error(`insert idempotent notification: ${JSON.stringify(insErr)}`)
		}
		const id = row.id as string

		const first = await updateNotificationReadForUser(fx.regularUserId, id)
		expect(first.error).toBeNull()
		expect(first.data?.id).toBe(id)

		const second = await updateNotificationReadForUser(fx.regularUserId, id)
		expect(second.error).toBeNull()
		expect(second.data?.id).toBe(id)

		await admin.from('notifications').delete().eq('id', id)
	})

	it('updateNotificationReadForUser returns null when not found', async () => {
		const { data, error } = await updateNotificationReadForUser(
			fx.regularUserId,
			'00000000-0000-4000-8000-000000000099',
		)
		expect(error).toBeNull()
		expect(data).toBeNull()
	})
})

// ============================================================================
// Admin Panel — analytics orchestration (MV + memo cache)
// ============================================================================

import 'server-only'

import {
	countFlaggedListings,
	countReportsByStatus,
	fetchMvAdminDailyStatsInRange,
	fetchResolvedReportsForAvgResolution,
} from '../_data-access/analyticsDafs'
import type { MvAdminDailyStatsRow, PlatformType } from '@/lib/supabase/database.types'

import { getAdminAnalyticsCache, setAdminAnalyticsCache } from './analyticsCache'
import type { AdminAnalyticsWindowQuery } from '../schemas'

function utcDateStringDaysAgo(days: number): string {
	const d = new Date()
	d.setUTCDate(d.getUTCDate() - days)
	return d.toISOString().slice(0, 10)
}

function utcTodayString(): string {
	return new Date().toISOString().slice(0, 10)
}

export type AdminOverviewPayload = {
	days: number
	from: string
	to: string
	totals: Record<string, number>
	byMetricAndPlatform: Array<{
		metric: string
		platform: PlatformType | null
		value: number
	}>
}

export async function getAdminOverview(
	query: AdminAnalyticsWindowQuery,
): Promise<{ data: AdminOverviewPayload | null; error: unknown }> {
	const cacheKey = `overview:${query.days}`
	const cached = getAdminAnalyticsCache<AdminOverviewPayload>(cacheKey)
	if (cached) {
		return { data: cached, error: null }
	}

	const from = utcDateStringDaysAgo(query.days)
	const to = utcTodayString()
	const { data: rows, error } = await fetchMvAdminDailyStatsInRange(from, to)
	if (error) {
		return { data: null, error }
	}

	const totals: Record<string, number> = {}
	const byMetricAndPlatform: AdminOverviewPayload['byMetricAndPlatform'] = []

	for (const r of rows ?? []) {
		const key = r.metric
		totals[key] = (totals[key] ?? 0) + Number(r.value)
		byMetricAndPlatform.push({
			metric: r.metric,
			platform: r.platform,
			value: Number(r.value),
		})
	}

	const payload: AdminOverviewPayload = {
		days: query.days,
		from,
		to,
		totals,
		byMetricAndPlatform,
	}
	setAdminAnalyticsCache(cacheKey, payload)
	return { data: payload, error: null }
}

export type AdminGmvPoint = { stat_date: string; platform: PlatformType | null; value: number }

export async function getAdminGmvSeries(
	query: AdminAnalyticsWindowQuery,
): Promise<{ data: AdminGmvPoint[] | null; error: unknown }> {
	const cacheKey = `gmv:${query.days}`
	const cached = getAdminAnalyticsCache<AdminGmvPoint[]>(cacheKey)
	if (cached) {
		return { data: cached, error: null }
	}

	const from = utcDateStringDaysAgo(query.days)
	const to = utcTodayString()
	const { data: rows, error } = await fetchMvAdminDailyStatsInRange(from, to)
	if (error) {
		return { data: null, error }
	}

	const points: AdminGmvPoint[] = (rows ?? [])
		.filter((r: MvAdminDailyStatsRow) => r.metric === 'revenue')
		.map((r) => ({
			stat_date: r.stat_date,
			platform: r.platform,
			value: Number(r.value),
		}))

	setAdminAnalyticsCache(cacheKey, points)
	return { data: points, error: null }
}

export type AdminModerationKpisPayload = {
	pending_reports: number
	flagged_listings: number
	avg_resolution_hours: number | null
	sample_size: number
}

export async function getAdminModerationKpis(): Promise<{
	data: AdminModerationKpisPayload | null
	error: unknown
}> {
	const cacheKey = 'moderation_kpis'
	const cached = getAdminAnalyticsCache<AdminModerationKpisPayload>(cacheKey)
	if (cached) {
		return { data: cached, error: null }
	}

	const { data: pending, error: pErr } = await countReportsByStatus('pending')
	if (pErr) {
		return { data: null, error: pErr }
	}

	const { data: flagged, error: fErr } = await countFlaggedListings()
	if (fErr) {
		return { data: null, error: fErr }
	}

	const { data: resolvedRows, error: rErr } = await fetchResolvedReportsForAvgResolution(5000)
	if (rErr) {
		return { data: null, error: rErr }
	}

	let avgHours: number | null = null
	const sample = resolvedRows ?? []
	if (sample.length > 0) {
		let totalMs = 0
		for (const r of sample) {
			const c = new Date(r.created_at).getTime()
			const x = new Date(r.resolved_at!).getTime()
			totalMs += x - c
		}
		avgHours = totalMs / sample.length / 3600000
	}

	const payload: AdminModerationKpisPayload = {
		pending_reports: pending,
		flagged_listings: flagged,
		avg_resolution_hours: avgHours,
		sample_size: sample.length,
	}
	setAdminAnalyticsCache(cacheKey, payload)
	return { data: payload, error: null }
}

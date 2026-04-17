// ============================================================================
// Profiles — avatar upload to Storage
// ============================================================================
//
// Validates size/MIME, uploads to `avatars` bucket under `{userId}/{uuid}.ext`,
// then persists `avatar_url` on profiles via updateProfile. Path prefix matches
// storage RLS (folder = user id).

import { randomUUID } from 'crypto'

import { getAdmin } from '@/lib/supabase/clients/adminClient'

import { AVATAR_ALLOWED_MIME, AVATAR_MAX_BYTES } from '@/lib/features/profiles/config'
import { updateProfile } from '../_data-access/profilesDafs'

function extFromMime(mime: string): string {
	if (mime === 'image/jpeg') {
		return 'jpg'
	}
	if (mime === 'image/png') {
		return 'png'
	}
	if (mime === 'image/webp') {
		return 'webp'
	}
	return 'bin'
}

/**
 * Stores an image in the avatars bucket and updates the profile’s avatar_url.
 *
 * @param userId - Owner id (must match storage policy path).
 * @param file - Multipart file from the route.
 * @returns New public URL or structured errors (FILE_TOO_LARGE, INVALID_MIME).
 */
export async function uploadAvatar(
	userId: string,
	file: File,
): Promise<{ data: { avatar_url: string } | null; error: unknown }> {
	if (file.size > AVATAR_MAX_BYTES) {
		return { data: null, error: new Error('FILE_TOO_LARGE') }
	}
	const mime = file.type
	if (!AVATAR_ALLOWED_MIME.includes(mime as (typeof AVATAR_ALLOWED_MIME)[number])) {
		return { data: null, error: new Error('INVALID_MIME') }
	}

	const ext = extFromMime(mime)
	const path = `${userId}/${randomUUID()}.${ext}`

	const buf = Buffer.from(await file.arrayBuffer())
	const { error: upErr } = await getAdmin().storage.from('avatars').upload(path, buf, {
		contentType: mime,
		upsert: true,
	})

	if (upErr) {
		return { data: null, error: upErr }
	}

	const { data: pub } = getAdmin().storage.from('avatars').getPublicUrl(path)
	const avatar_url = pub.publicUrl

	const { data, error } = await updateProfile(userId, { avatar_url })
	if (error || !data) {
		return { data: null, error }
	}

	return { data: { avatar_url }, error: null }
}

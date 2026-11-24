import { NextResponse } from 'next/server'
import { apiError, readJson, requireAuthenticated } from '@/lib/api-security'
import { getSupabaseAdminClient } from '@/lib/admin-db'
import { sanitizeJpegUpload } from '@/lib/image-upload'

export const runtime = 'nodejs'

/**
 * Profile pictures live in the private `avatars` bucket at `<user id>/avatar.jpg`.
 * Only the server (service role) touches storage; students get short-lived signed URLs.
 */
const BUCKET = 'avatars'
const MAX_BYTES = 400 * 1024
const SIGNED_SECONDS = 60 * 60 * 24 * 7
const pathOf = (userId: string) => `${userId}/avatar.jpg`

async function signed(userId: string) {
  const { data, error } = await getSupabaseAdminClient().storage.from(BUCKET).createSignedUrl(pathOf(userId), SIGNED_SECONDS)
  if (error || !data) return null
  return { url: data.signedUrl, expiresAt: Date.now() + SIGNED_SECONDS * 1000 }
}

const noStore = { 'Cache-Control': 'no-store' }

export async function GET() {
  try {
    const { user } = await requireAuthenticated('avatar-read', 60)
    return NextResponse.json({ success: true, avatar: await signed(user.id) }, { headers: noStore })
  } catch (error) {
    return apiError(error, 'We could not load your profile picture.')
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAuthenticated('avatar-write', 10)
    const body = await readJson(req, 600 * 1024)
    const bytes = await sanitizeJpegUpload(body.image, {
      maxBytes: MAX_BYTES,
      missingMessage: 'Please choose a JPEG photo.',
      invalidMessage: 'That file is not a valid photo.',
      tooLargeMessage: 'That photo is too large. Please pick another one.',
      maxEdge: 512,
      quality: 82,
    })
    const { error } = await getSupabaseAdminClient().storage.from(BUCKET)
      .upload(pathOf(user.id), bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
    if (error) throw new Error('upload_failed')
    return NextResponse.json({ success: true, avatar: await signed(user.id) }, { headers: noStore })
  } catch (error) {
    return apiError(error, 'We could not save your profile picture. Please try again.')
  }
}

export async function DELETE() {
  try {
    const { user } = await requireAuthenticated('avatar-write', 10)
    const { error } = await getSupabaseAdminClient().storage.from(BUCKET).remove([pathOf(user.id)])
    if (error) throw new Error('avatar_delete_failed')
    return NextResponse.json({ success: true, avatar: null }, { headers: noStore })
  } catch (error) {
    return apiError(error, 'We could not remove your profile picture. Please try again.')
  }
}

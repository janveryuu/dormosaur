import { NextResponse } from 'next/server'
import { apiError, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { getSupabaseAdminClient } from '@/lib/admin-db'

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
    const match = typeof body.image === 'string' ? /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(body.image) : null
    if (!match) throw new InputError('Please choose a JPEG photo.')
    const bytes = Buffer.from(match[1], 'base64')
    // JPEG magic number check: never trust the declared type alone.
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new InputError('That file is not a valid photo.')
    if (bytes.length > MAX_BYTES) throw new InputError('That photo is too large. Please pick another one.', 413)
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
    await getSupabaseAdminClient().storage.from(BUCKET).remove([pathOf(user.id)])
    return NextResponse.json({ success: true, avatar: null }, { headers: noStore })
  } catch (error) {
    return apiError(error, 'We could not remove your profile picture. Please try again.')
  }
}

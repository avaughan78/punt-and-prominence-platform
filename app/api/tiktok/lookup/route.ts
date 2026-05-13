import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')
  const userId = request.nextUrl.searchParams.get('userId')
  // Whether to cache the photo — only if no Instagram photo already set
  const cachePhoto = request.nextUrl.searchParams.get('cachePhoto') === 'true'

  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const key = process.env.RAPIDAPI_KEY
  if (!key) return NextResponse.json({ error: 'API not configured' }, { status: 500 })

  const clean = handle.replace(/^@/, '').trim()
  const url = `https://tiktokscraper.p.rapidapi.com/user-details?username=${encodeURIComponent(clean)}`

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'tiktokscraper.p.rapidapi.com',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status })
  }

  const json = await res.json()
  const d = json?.data
  if (!d) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const tiktokImageUrl = d.avatarLarger ?? d.avatarMedium ?? null

  // Cache the TikTok photo only when the creator has no Instagram photo yet
  let cachedImageUrl: string | null = tiktokImageUrl
  if (userId && cachePhoto && tiktokImageUrl) {
    try {
      const imgRes = await fetch(tiktokImageUrl)
      if (imgRes.ok) {
        const blob = await imgRes.blob()
        const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
        const ext = contentType.includes('png') ? 'png' : 'jpg'
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const path = `${userId}/avatar.${ext}`
        const { error } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { upsert: true, contentType })
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
          cachedImageUrl = `${publicUrl}?t=${Date.now()}`
        }
      }
    } catch {
      // Fall back to original URL
    }
  }

  return NextResponse.json({
    handle: d.uniqueId ?? clean,
    name: d.nickname ?? null,
    image: cachedImageUrl,
    bio: d.signature ?? null,
    website: d.bioLink?.link ?? null,
    followers: d.stats?.followerCount ?? null,
    likes: d.stats?.heartCount ?? null,
    videos: d.stats?.videoCount ?? null,
    verified: d.verified ?? false,
    isPrivate: d.privateAccount ?? false,
  })
}

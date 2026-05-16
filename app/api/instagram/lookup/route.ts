import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')
  const userId = request.nextUrl.searchParams.get('userId')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const key = process.env.RAPIDAPI_KEY
  if (!key) return NextResponse.json({ error: 'API not configured' }, { status: 500 })

  const clean = handle.replace(/^@/, '').trim()
  const url = `https://instagram-looter2.p.rapidapi.com/profile?username=${encodeURIComponent(clean)}`

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com',
      'x-rapidapi-key': key,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status })
  }

  const json = await res.json()

  // Response may be at top level or nested under data/user
  const d = json?.data?.user ?? json?.data ?? json?.user ?? json
  if (!d?.username) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const instagramImageUrl =
    d.hd_profile_pic_url_info?.url ??
    d.profile_pic_url_hd ??
    d.profile_pic_url ??
    null

  // If userId provided, download and re-upload to Supabase so the URL doesn't expire
  let cachedImageUrl: string | null = instagramImageUrl
  if (userId && instagramImageUrl) {
    try {
      const imgRes = await fetch(instagramImageUrl)
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
      // Fall back to the original URL if caching fails
    }
  }

  return NextResponse.json({
    handle: d.username ?? clean,
    name: d.full_name ?? null,
    image: cachedImageUrl,
    bio: d.biography ?? null,
    followers: d.follower_count ?? d.edge_followed_by?.count ?? null,
    following: d.following_count ?? d.edge_follow?.count ?? null,
    posts: d.media_count ?? d.edge_owner_to_timeline_media?.count ?? null,
    verified: d.is_verified ?? false,
    isPrivate: d.is_private ?? false,
    website: d.external_url || null,
  })
}

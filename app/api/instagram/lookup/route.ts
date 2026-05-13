import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const key = process.env.RAPIDAPI_KEY
  if (!key) return NextResponse.json({ error: 'API not configured' }, { status: 500 })

  const clean = handle.replace(/^@/, '').trim()
  const url = `https://instagram-scraper-api14.p.rapidapi.com/instagram/profile?username=${encodeURIComponent(clean)}`

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'instagram-scraper-api14.p.rapidapi.com',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status })
  }

  const json = await res.json()
  if (!json.success || !json.data) {
    return NextResponse.json({ error: json.error ?? 'Profile not found' }, { status: 404 })
  }

  const d = json.data

  return NextResponse.json({
    handle: d.username ?? clean,
    name: d.full_name ?? null,
    image: d.profile_pic_url_hd ?? d.profile_pic_url ?? null,
    bio: d.biography ?? null,
    followers: d.follower_count ?? null,
    following: d.following_count ?? null,
    posts: d.media_count ?? null,
    verified: d.is_verified ?? false,
    isPrivate: d.is_private ?? false,
    website: d.external_url ?? null,
  })
}

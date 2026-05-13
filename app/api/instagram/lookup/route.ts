import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const key = process.env.RAPIDAPI_KEY
  if (!key) return NextResponse.json({ error: 'API not configured' }, { status: 500 })

  const clean = handle.replace(/^@/, '').trim()
  const url = `https://instagram-statistics-api.p.rapidapi.com/community?url=https://www.instagram.com/${encodeURIComponent(clean)}`

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com',
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status })
  }

  const json = await res.json()
  const d = json?.data

  if (!d) return NextResponse.json({ error: 'No data returned' }, { status: 502 })

  return NextResponse.json({
    handle: d.screenName ?? clean,
    name: d.name ?? null,
    image: d.image ?? null,
    bio: d.description ?? null,
    followers: d.usersCount ?? null,
    engagementRate: d.avgER ?? null,
    verified: d.verified ?? false,
    collecting: d.communityStatus === 'COLLECTING',
  })
}

import { NextResponse } from 'next/server'

function parseCount(raw: string): number | null {
  // Handles "23.4K", "1.2M", "892", "23,456"
  const m = raw.replace(/,/g, '').match(/^([\d.]+)(K|M|B)?$/i)
  if (!m) return null
  const n = parseFloat(m[1])
  const mult = m[2]?.toUpperCase() === 'K' ? 1_000 : m[2]?.toUpperCase() === 'M' ? 1_000_000 : m[2]?.toUpperCase() === 'B' ? 1_000_000_000 : 1
  return Math.round(n * mult)
}

async function tryWebProfileInfo(handle: string) {
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com',
      },
      next: { revalidate: 0 },
    }
  )
  if (!res.ok) return null
  const json = await res.json()
  const user = json?.data?.user
  if (!user) return null
  return {
    username: user.username as string,
    full_name: (user.full_name as string) || null,
    biography: (user.biography as string) || null,
    profile_pic_url: (user.profile_pic_url_hd ?? user.profile_pic_url) as string | null,
    follower_count: (user.edge_followed_by?.count as number) ?? null,
    following_count: (user.edge_follow?.count as number) ?? null,
    post_count: (user.edge_owner_to_timeline_media?.count as number) ?? null,
    is_verified: (user.is_verified as boolean) ?? false,
    is_private: (user.is_private as boolean) ?? false,
  }
}

async function tryHtmlScrape(handle: string) {
  const res = await fetch(`https://www.instagram.com/${handle}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  const html = await res.text()

  const meta = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]*)"`, 'i'))
      ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${prop}"`, 'i'))
    return m?.[1] ? m[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'") : null
  }

  const description = meta('og:description')
  const image = meta('og:image')
  const title = meta('og:title') // e.g. "Jane Smith (@handle)"

  if (!description) return null

  // "23.4K Followers, 892 Following, 156 Posts - See Instagram..."
  const followerMatch = description.match(/^([\d,.]+K?M?B?)\s+Follower/i)
  const follower_count = followerMatch ? parseCount(followerMatch[1]) : null

  const postMatch = description.match(/([\d,.]+K?M?B?)\s+Posts?\s*-/i)
  const post_count = postMatch ? parseCount(postMatch[1]) : null

  const full_name = title?.replace(/\s*\(@[^)]+\)/, '').trim() || null

  return {
    username: handle,
    full_name,
    biography: null,
    profile_pic_url: image,
    follower_count,
    following_count: null,
    post_count,
    is_verified: false,
    is_private: false,
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const clean = handle.replace(/^@/, '').trim().toLowerCase()

  if (!clean || !/^[a-z0-9._]{1,30}$/.test(clean)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 })
  }

  try {
    const data = (await tryWebProfileInfo(clean)) ?? (await tryHtmlScrape(clean))
    if (!data) return NextResponse.json({ error: 'Profile not found or is private' }, { status: 404 })
    if (data.is_private) return NextResponse.json({ error: 'Account is private — must be public to join' }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Could not reach Instagram' }, { status: 502 })
  }
}

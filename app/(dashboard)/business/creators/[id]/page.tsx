import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorPublicProfileView, type CreatorPublicData, type PublicMatch } from '@/components/profile/CreatorPublicProfileView'

export default async function BusinessCreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const { data: creator } = await supabase
    .from('profiles')
    .select('id, display_name, instagram_handle, tiktok_handle, avatar_url, follower_count, tiktok_follower_count, bio, website_url')
    .eq('id', id)
    .eq('role', 'creator')
    .single()

  if (!creator) redirect('/business/creators')

  const { data: rawMatches } = await supabase
    .from('matches')
    .select(`
      id, offer_id, closed_at, created_at,
      offer:offers(title, value_gbp, fee_gbp, invite_type, category),
      deliverables:match_deliverables(id, month_number, post_url, verified_at)
    `)
    .eq('creator_id', id)

  const matches = (rawMatches ?? []) as unknown as PublicMatch[]

  return (
    <CreatorPublicProfileView
      creator={creator as unknown as CreatorPublicData}
      matches={matches}
      backHref="/business/creators"
      backLabel="All creators"
      offerLinkBase="/business/invites"
    />
  )
}

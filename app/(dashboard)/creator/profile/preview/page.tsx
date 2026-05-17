import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorPublicProfileView, type CreatorPublicData, type PublicMatch } from '@/components/profile/CreatorPublicProfileView'

export default async function CreatorProfilePreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase
    .from('profiles')
    .select(`
      id, display_name, instagram_handle, tiktok_handle, avatar_url,
      follower_count, tiktok_follower_count, bio, website_url,
      matches:matches!matches_creator_id_fkey(
        id, closed_at, created_at,
        offer:offers(title, value_gbp, fee_gbp, invite_type, category),
        deliverables:match_deliverables(id, month_number, post_url, verified_at)
      )
    `)
    .eq('id', user.id)
    .eq('role', 'creator')
    .single()

  if (!creator) redirect('/creator/profile')

  const matches = (creator.matches ?? []) as unknown as PublicMatch[]

  return (
    <CreatorPublicProfileView
      creator={creator as unknown as CreatorPublicData}
      matches={matches}
      backHref="/creator/profile"
      backLabel="Back to profile"
      isSelf
    />
  )
}

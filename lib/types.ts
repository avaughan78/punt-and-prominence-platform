export type Role = 'business' | 'creator'

export type MatchStatus = 'accepted' | 'posted' | 'verified' | 'active' | 'completed'

export type InviteCategory = 'dining' | 'retail' | 'experience' | 'fitness' | 'beauty' | 'other'

export type InviteType = 'one_off' | 'retainer'

export interface MatchDeliverable {
  id: string
  match_id: string
  month_number: number | null
  post_url: string
  status: 'submitted' | 'verified'
  verified_at: string | null
  created_at: string
}

export type BusinessCategory = 'cafe' | 'restaurant' | 'bar' | 'retail' | 'fitness' | 'beauty' | 'hotel' | 'other'

export interface Profile {
  id: string
  role: Role
  display_name: string
  bio: string | null
  instagram_handle: string | null
  website_url: string | null
  avatar_url: string | null
  follower_count: number | null
  // Business fields
  business_name: string | null
  address_line: string | null
  category: string | null
  latitude: number | null
  longitude: number | null
  // Billing mock
  has_card_on_file: boolean
  card_last_four: string | null
  created_at: string
  updated_at: string
}

export interface Invite {
  id: string
  business_id: string
  title: string
  description: string
  category: InviteCategory
  invite_type: InviteType
  value_gbp: number
  fee_gbp: number | null
  posts_per_month: number | null
  duration_months: number | null
  requirements: string | null
  slots_total: number
  slots_claimed: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
  // Joined
  business?: Pick<Profile, 'id' | 'display_name' | 'business_name' | 'address_line' | 'category' | 'latitude' | 'longitude' | 'avatar_url' | 'instagram_handle'>
  matches?: MatchPreview[]
}

export interface MatchPreview {
  id: string
  status: MatchStatus
  punt_code: string
  created_at: string
  post_url: string | null
  creator: Pick<Profile, 'id' | 'display_name' | 'instagram_handle' | 'avatar_url' | 'follower_count'>
  deliverables?: MatchDeliverable[]
}

export interface Match {
  id: string
  offer_id: string
  creator_id: string
  business_id: string
  status: MatchStatus
  punt_code: string
  post_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  invite?: Invite
  creator?: Pick<Profile, 'id' | 'display_name' | 'instagram_handle' | 'avatar_url' | 'follower_count'>
  business?: Pick<Profile, 'id' | 'display_name' | 'business_name' | 'address_line'>
  deliverables?: MatchDeliverable[]
}

// Supabase DB type scaffold (minimal — expand as needed)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; role: Role; display_name: string }
        Update: Partial<Profile>
      }
      offers: {
        Row: Invite
        Insert: Omit<Invite, 'id' | 'slots_claimed' | 'created_at' | 'updated_at' | 'business'>
        Update: Partial<Omit<Invite, 'id' | 'business_id' | 'created_at' | 'business'>>
      }
      matches: {
        Row: Match
        Insert: Omit<Match, 'id' | 'created_at' | 'updated_at' | 'offer' | 'creator' | 'business'>
        Update: Partial<Pick<Match, 'status' | 'post_url' | 'notes'>>
      }
      invite_codes: {
        Row: { id: string; code: string; used: boolean; used_by: string | null; created_at: string }
        Insert: { code: string }
        Update: { used: boolean; used_by: string }
      }
    }
  }
}

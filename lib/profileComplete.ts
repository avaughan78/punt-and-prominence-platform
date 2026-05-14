export function isCreatorProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false
  return !!(profile.instagram_handle && profile.follower_count != null)
}

export function isBusinessProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false
  return !!(profile.business_name && profile.category && profile.address_line)
}

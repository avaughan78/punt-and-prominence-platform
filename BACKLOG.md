# Punt & Prominence — Backlog

Items that are planned but not yet started. Roughly ordered by priority.

---

## Identity & Trust

### Instagram OAuth (creator sign-up)
Require creators to authenticate via Instagram OAuth during onboarding, proving they own the handle they're claiming. No one can register as @someone_else without logging into that Instagram account.
- Requires a Meta developer app and passing App Review before it works in production
- Unblocks other items (real follower counts, verified reach data)
- **Blocked by:** Meta App Review (see below)

### Meta App Review
Submit the app for Meta's review process to unlock the Instagram Graph API permissions needed for:
- Verifying account ownership (OAuth)
- Pulling real follower counts and engagement data during onboarding (replacing manual entry)
- Reading post reach/impressions for match reporting

This is a prerequisite for the two items above. Requires a clear use-case description and demo video showing how the data is used.

---

## Creator Discovery

### ~~"Meet our creators" browsable profiles~~ ✅ Done
`/business/creators` and `/business/creators/[id]` already exist. Public listing at `/creators` too.

### Case studies / past collabs
A "recent campaigns" section: business name, creator handle, and the post that came out of it. Strong social proof once first matches are complete. *(Inspired by Joli)*

### Aggregate network stats on display
Network-level stats: avg engagement rate, % local audience, niches covered. Reinforces credibility of the creator pool without exposing individual profiles. *(Inspired by Collabstr)*

### Category / niche filtering
Allow businesses to filter creators by content niche (food, lifestyle, fashion, fitness etc). Not needed at current scale but useful as the pool grows. *(Inspired by Social Cat)*

---

## Creator Mobile App

### ~~PWA~~ ✅ Done — manifest, icons, apple-touch-icon, safe-area nav all shipped.

### Native app for creators (Expo / React Native)
A dedicated iOS/Android app for the creator side of the platform. The Supabase backend, auth, and all API routes would be reused as-is — only the creator-facing screens need building (Dashboard, Browse, Matches, Profile).

Key benefits over the web app:
- Push notifications ("you've been matched", "your post was verified")
- Native camera/media picker for post proof uploads
- App Store distribution and home screen presence

**Suggested approach:** Ship a PWA first (add `manifest.json` + service worker — ~1 day) to validate the mobile workflow, then invest in Expo if App Store distribution or push notifications become a clear need. Main non-trivial effort: image/video picker for proof uploads, and Apple App Store review.

---

## Misc

### Instagram bio verification (interim identity check)
Short-term alternative to OAuth: generate a code (e.g. `P&P-A3X7`) and ask the creator to paste it into their bio temporarily. Fetch the bio via the Graph API to confirm ownership, then let them remove it. Simpler than OAuth but still blocks impersonation.
- Can be built without App Review using basic display permissions
- Replace with full OAuth once Meta approval lands

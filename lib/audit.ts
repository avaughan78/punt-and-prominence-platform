import { createAdminClient } from '@/lib/supabase/admin'

type AuditEvent =
  | 'business.registered'
  | 'business.deleted'
  | 'business.suspended'
  | 'business.unsuspended'
  | 'creator.registered'
  | 'creator.deleted'
  | 'creator.approved'
  | 'creator.rejected'
  | 'creator.revoked'
  | 'match.created'
  | 'match.status_changed'
  | 'invite.created'
  | 'invite.deleted'
  | 'invite_code.created'
  | 'waitlist.signup'

export async function writeAuditLog({
  event_type,
  actor,
  subject_type,
  subject_id,
  metadata = {},
}: {
  event_type: AuditEvent
  actor: string
  subject_type: string
  subject_id: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createAdminClient()
  await supabase.from('audit_logs').insert({
    event_type,
    actor,
    subject_type,
    subject_id,
    metadata,
  })
}

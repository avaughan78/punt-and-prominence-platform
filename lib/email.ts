import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Punt & Prominence <hello@puntandprominence.co.uk>'

async function send(to: string, subject: string, html: string) {
  if (!resend) return
  await resend.emails.send({ from: FROM, to, subject, html }).catch(console.error)
}

function wrap(body: string) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1C2B3A;">
      <div style="margin-bottom:24px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#F5B800;">★ PUNT & PROMINENCE</span>
      </div>
      ${body}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
        Cambridge's local creator marketplace · <a href="mailto:hello@puntandprominence.co.uk" style="color:#9ca3af;">hello@puntandprominence.co.uk</a>
      </div>
    </div>
  `
}

export async function emailMatchClaimed(opts: {
  businessEmail: string
  businessName: string
  creatorName: string
  offerTitle: string
  puntCode: string
}) {
  await send(
    opts.businessEmail,
    `New match: ${opts.creatorName} claimed your offer`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Someone claimed your offer</h2>
      <p style="color:#6b7280;margin:0 0 24px;">${opts.creatorName} has claimed <strong>${opts.offerTitle}</strong>.</p>
      <div style="background:#1C2B3A;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;font-family:'JetBrains Mono',monospace;margin:0 0 4px;">PUNT CODE</p>
        <p style="color:#F5B800;font-size:24px;font-weight:700;font-family:'JetBrains Mono',monospace;letter-spacing:4px;margin:0;">${opts.puntCode}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">When they visit, ask for this code and mark the match as visited in your dashboard.</p>
    `)
  )
}

export async function emailMatchVisited(opts: {
  creatorEmail: string
  creatorName: string
  businessName: string
  offerTitle: string
  puntCode: string
}) {
  await send(
    opts.creatorEmail,
    `You've been marked as visited — post within 72 hours`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Your visit has been confirmed</h2>
      <p style="color:#6b7280;margin:0 0 16px;"><strong>${opts.businessName}</strong> has marked you as visited for <strong>${opts.offerTitle}</strong>.</p>
      <p style="color:#6b7280;margin:0 0 24px;">You now have <strong>72 hours</strong> to post your content and submit the link in your matches dashboard.</p>
      <div style="background:#1C2B3A;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;font-family:'JetBrains Mono',monospace;margin:0 0 4px;">YOUR PUNT CODE</p>
        <p style="color:#F5B800;font-size:24px;font-weight:700;font-family:'JetBrains Mono',monospace;letter-spacing:4px;margin:0;">${opts.puntCode}</p>
      </div>
    `)
  )
}

export async function emailMatchPosted(opts: {
  businessEmail: string
  businessName: string
  creatorName: string
  offerTitle: string
  postUrl: string
}) {
  await send(
    opts.businessEmail,
    `${opts.creatorName} submitted their post — please verify`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Post submitted for verification</h2>
      <p style="color:#6b7280;margin:0 0 16px;"><strong>${opts.creatorName}</strong> has submitted their post for <strong>${opts.offerTitle}</strong>.</p>
      <p style="margin:0 0 24px;">
        <a href="${opts.postUrl}" style="color:#1C2B3A;font-weight:600;">View the post →</a>
      </p>
      <p style="color:#6b7280;font-size:14px;">If the post meets your requirements, mark it as verified in your matches dashboard.</p>
    `)
  )
}

export async function emailMatchVerified(opts: {
  creatorEmail: string
  creatorName: string
  businessName: string
  offerTitle: string
}) {
  await send(
    opts.creatorEmail,
    `Match verified — well done!`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Your match has been verified</h2>
      <p style="color:#6b7280;margin:0 0 16px;"><strong>${opts.businessName}</strong> has verified your post for <strong>${opts.offerTitle}</strong>.</p>
      <p style="color:#6BE6B0;font-weight:600;">✓ Match complete</p>
      <p style="color:#6b7280;font-size:14px;margin-top:8px;">Thanks for creating great content for a Cambridge business. Browse more offers in your dashboard.</p>
    `)
  )
}

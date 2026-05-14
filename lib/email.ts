import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Punt & Prominence <hello@puntandprominence.co.uk>'
const APP_URL = process.env.APP_URL ?? 'https://puntandprominence.co.uk'

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

export async function emailWelcomeBusiness(opts: { email: string; name: string }) {
  await send(
    opts.email,
    `Welcome to Punt & Prominence`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Welcome, ${opts.name} 👋</h2>
      <p style="color:#6b7280;margin:0 0 16px;">You're in. Punt & Prominence connects your business with Cambridge's best local creators.</p>
      <p style="color:#6b7280;margin:0 0 8px;font-weight:600;">Here's how it works:</p>
      <ol style="color:#6b7280;margin:0 0 24px;padding-left:20px;line-height:1.8;">
        <li>Complete your business profile</li>
        <li>Create a collab — set the value, slots, and what you'd like creators to post</li>
        <li>Creators claim your collab and visit your business</li>
        <li>Review their post and verify it when it goes live</li>
      </ol>
      <a href="${APP_URL}/business" style="display:inline-block;background:#1C2B3A;color:#F5B800;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-family:'JetBrains Mono',monospace;">Go to your dashboard →</a>
    `)
  )
}

export async function emailCreatorApproved(opts: { email: string; name: string }) {
  await send(
    opts.email,
    `You're approved — start claiming collabs`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">You're approved! 🎉</h2>
      <p style="color:#6b7280;margin:0 0 24px;">Hi ${opts.name}, your Punt & Prominence profile has been reviewed and approved. You can now claim collabs from Cambridge businesses.</p>
      <a href="${APP_URL}/creator/browse" style="display:inline-block;background:#1C2B3A;color:#F5B800;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-family:'JetBrains Mono',monospace;">Browse collabs →</a>
    `)
  )
}

export async function emailCreatorRejected(opts: { email: string; name: string; reason?: string }) {
  await send(
    opts.email,
    `Update on your Punt & Prominence application`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Thanks for applying</h2>
      <p style="color:#6b7280;margin:0 0 16px;">Hi ${opts.name}, thank you for signing up to Punt & Prominence.</p>
      ${opts.reason
        ? `<p style="color:#6b7280;margin:0 0 16px;">${opts.reason}</p>`
        : `<p style="color:#6b7280;margin:0 0 16px;">Unfortunately we're not able to approve your profile at this time. We focus on creators with an engaged Cambridge audience — if your following grows, we'd love to have you back.</p>`
      }
      <p style="color:#6b7280;font-size:14px;">Questions? Reply to this email or contact <a href="mailto:hello@puntandprominence.co.uk" style="color:#1C2B3A;">hello@puntandprominence.co.uk</a>.</p>
    `)
  )
}

export async function emailWelcomeCreator(opts: { email: string; name: string }) {
  await send(
    opts.email,
    `Welcome to Punt & Prominence`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Welcome, ${opts.name} 👋</h2>
      <p style="color:#6b7280;margin:0 0 16px;">You're in. Punt & Prominence connects Cambridge creators with local businesses who want great content.</p>
      <p style="color:#6b7280;margin:0 0 8px;font-weight:600;">Here's how it works:</p>
      <ol style="color:#6b7280;margin:0 0 24px;padding-left:20px;line-height:1.8;">
        <li>Complete your profile and add your Instagram handle</li>
        <li>Browse available collabs from local businesses</li>
        <li>Claim one, visit the business, and create your content</li>
        <li>Submit your post link — the business verifies it and the match is complete</li>
      </ol>
      <a href="${APP_URL}/creator/browse" style="display:inline-block;background:#1C2B3A;color:#F5B800;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-family:'JetBrains Mono',monospace;">Browse collabs →</a>
    `)
  )
}

export async function emailWaitlistConfirmation(opts: { email: string }) {
  const html = `
    <div style="background:#f3f4f6;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- Hero -->
        <div style="background:#1C2B3A;padding:44px 36px 36px;text-align:center;">
          <p style="font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;color:#F5B800;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 20px;">★ &nbsp;Punt &amp; Prominence</p>
          <h1 style="font-size:38px;font-weight:800;color:#ffffff;margin:0 0 10px;line-height:1.1;font-family:Georgia,'Times New Roman',serif;">You're on<br>the list.</h1>
          <p style="font-size:13px;color:rgba(255,255,255,0.42);margin:0 0 24px;letter-spacing:0.05em;">Cambridge, UK &nbsp;·&nbsp; Launching 2026</p>
          <div style="width:44px;height:3px;background:#F5B800;border-radius:2px;margin:0 auto;"></div>
        </div>

        <!-- Body -->
        <div style="background:#ffffff;padding:36px 36px 28px;">
          <div style="display:inline-block;background:rgba(107,230,176,0.12);border:1px solid rgba(107,230,176,0.35);border-radius:999px;padding:5px 14px;margin-bottom:22px;">
            <span style="color:#059669;font-size:12px;font-weight:700;">✓ &nbsp;Confirmed</span>
          </div>
          <p style="font-size:16px;font-weight:700;color:#1C2B3A;margin:0 0 10px;">We'll be in touch.</p>
          <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.75;">
            We're building Cambridge's most focused creator network — connecting local businesses with verified micro-creators who have real, engaged local audiences. You're among the first to hear about it.
          </p>
        </div>

        <!-- Stats band -->
        <div style="background:#f8f9fa;border-top:1px solid #efefef;border-bottom:1px solid #efefef;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:center;padding:20px 12px;">
                <p style="font-size:26px;font-weight:800;color:#1C2B3A;margin:0;font-family:Georgia,serif;">30</p>
                <p style="font-size:9px;color:#9ca3af;margin:5px 0 0;text-transform:uppercase;letter-spacing:0.12em;font-family:'Courier New',Courier,monospace;">Verified creators</p>
              </td>
              <td style="text-align:center;padding:20px 12px;border-left:1px solid #e5e7eb;">
                <p style="font-size:26px;font-weight:800;color:#F5B800;margin:0;font-family:Georgia,serif;">30K+</p>
                <p style="font-size:9px;color:#9ca3af;margin:5px 0 0;text-transform:uppercase;letter-spacing:0.12em;font-family:'Courier New',Courier,monospace;">Local followers</p>
              </td>
              <td style="text-align:center;padding:20px 12px;border-left:1px solid #e5e7eb;">
                <p style="font-size:26px;font-weight:800;color:#1C2B3A;margin:0;font-family:Georgia,serif;">20</p>
                <p style="font-size:9px;color:#9ca3af;margin:5px 0 0;text-transform:uppercase;letter-spacing:0.12em;font-family:'Courier New',Courier,monospace;">Founding spots</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Reply CTA -->
        <div style="background:#ffffff;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
            Questions? Just reply to this email or reach us at<br>
            <a href="mailto:hello@puntandprominence.co.uk" style="color:#1C2B3A;font-weight:600;text-decoration:none;">hello@puntandprominence.co.uk</a>
          </p>
        </div>

        <!-- Dark footer -->
        <div style="background:#1C2B3A;padding:16px 36px;text-align:center;">
          <p style="font-size:9px;color:rgba(255,255,255,0.25);margin:0;letter-spacing:0.14em;text-transform:uppercase;font-family:'Courier New',Courier,monospace;">★ &nbsp;Punt &amp; Prominence &nbsp;·&nbsp; Cambridge, UK</p>
        </div>

      </div>
    </div>
  `
  await send(opts.email, `You're on the list — Punt & Prominence`, html)
}

export async function emailWaitlistNotify(opts: { email: string }) {
  await send(
    'hello@puntandprominence.co.uk',
    `New waitlist signup: ${opts.email}`,
    wrap(`
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">New waitlist signup</h2>
      <p style="color:#6b7280;margin:0;"><strong>${opts.email}</strong> just joined the waitlist.</p>
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

// Server-only: "thank you for your review" email via Resend, with Trustpilot
// AFS in BCC so reviewers receive a Trustpilot invitation. Never import from client code.
// Reads RESEND_API_KEY from the server environment.

const RESEND_URL = 'https://api.resend.com/emails'
const SITE_URL = 'https://www.staffadvisors.it'
const HEADER_IMG = `${SITE_URL}/email-header.jpg`
const FROM = 'StaffAdvisors <novita@news.staffadvisors.it>'
// Trustpilot Automatic Invitation Service address (BCC). Trustpilot sends the
// review invitation to the email's "To" recipient.
const TRUSTPILOT_BCC = 'staffadvisors.it+8b2c461dc6@invite.trustpilot.com'

function thanksHtml(companyName: string): string {
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 12px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <img src="${HEADER_IMG}" alt="StaffAdvisors" style="display:block;width:100%;height:auto;">
      <div style="padding:28px 28px 8px;color:#0A1931;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0A1931;">Grazie per la tua recensione!</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#0A1931;">La tua recensione su <strong>${companyName}</strong> è stata pubblicata e aiuterà altre persone a scegliere dove lavorare.</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#0A1931;">Se ti va, puoi aiutarci a far conoscere StaffAdvisors lasciando anche una recensione sulla nostra piattaforma: riceverai a breve un invito da Trustpilot, ci vogliono due minuti.</p>
        <a href="${SITE_URL}/app" style="display:inline-block;background:#FF6B00;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:12px;">Vedi la tua recensione</a>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">StaffAdvisors — recensioni anonime, offerte di lavoro e disponibilità.</p>
      </div>
      <div style="padding:16px 28px 24px;">
        <span style="font-size:11px;color:#9ca3af;">Ricevi questa email perché hai pubblicato una recensione su StaffAdvisors.</span>
      </div>
    </div>
  </div>
</body></html>`
}

/**
 * Sends the post-review thank-you email with Trustpilot AFS in BCC.
 * Never throws: email failures must not block review publication.
 */
export async function sendReviewThanksEmail(to: string, companyName: string): Promise<void> {
  try {
    const apiKey = process.env['RESEND_API_KEY']
    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured')
      return
    }
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        bcc: [TRUSTPILOT_BCC],
        subject: 'Grazie per la tua recensione su StaffAdvisors',
        html: thanksHtml(companyName),
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`Resend review-thanks failed [${res.status}]: ${body}`)
    }
  } catch (err) {
    console.error('Review thanks email error:', err)
  }
}

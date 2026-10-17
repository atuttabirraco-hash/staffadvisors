// Server-only: reactivation emails via Resend. Never import from client code.
// Reads RESEND_API_KEY and EMAIL_PEPPER from the server environment.

const RESEND_URL = 'https://api.resend.com/emails'
const SITE_URL = 'https://www.staffadvisors.it'
const HEADER_IMG = `${SITE_URL}/email-header.jpg`
const FROM = 'StaffAdvisors <novita@news.staffadvisors.it>'
const MIN_INTERVAL_DAYS = 10

export type ReactivationTemplate = 'completa-profilo' | 'novita-provincia'

async function unsubscribeToken(userId: string, province: string): Promise<string> {
  const pepper = process.env['EMAIL_PEPPER'] ?? ''
  const data = new TextEncoder().encode(`${userId}:${province}:${pepper}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export async function verifyUnsubscribeToken(userId: string, province: string, token: string): Promise<boolean> {
  return (await unsubscribeToken(userId, province)) === token
}

function emailHtml(opts: { title: string; body: string; cta: string; ctaUrl: string; unsubUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 12px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <img src="${HEADER_IMG}" alt="StaffAdvisors" style="display:block;width:100%;height:auto;">
      <div style="padding:28px 28px 8px;color:#0A1931;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0A1931;">${opts.title}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#0A1931;">${opts.body}</p>
        <a href="${opts.ctaUrl}" style="display:inline-block;background:#FF6B00;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:12px;">${opts.cta}</a>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">StaffAdvisors — recensioni anonime, offerte di lavoro e disponibilità.</p>
      </div>
      <div style="padding:16px 28px 24px;">
        <a href="${opts.unsubUrl}" style="font-size:11px;color:#9ca3af;text-decoration:underline;">Non voglio più ricevere queste email per la mia zona</a>
      </div>
    </div>
  </div>
</body></html>`
}

async function sendResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Resend failed [${res.status}]: ${body}`)
    throw new Error(`Resend request failed [${res.status}]: ${body}`)
  }
}

interface Candidate {
  user_id: string
  email: string
  template: ReactivationTemplate
  province: string | null
}

async function findCandidates(admin: any): Promise<Candidate[]> {
  const out: Candidate[] = []
  const now = Date.now()
  const threeDaysAgo = new Date(now - 3 * 24 * 3600 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString()

  // Consenting profiles
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, marketing_consent')
    .eq('marketing_consent', true)
  if (error) throw error
  if (!profiles?.length) return out
  const consenting = new Set<string>(profiles.map((p: any) => p.id as string))

  // Users with at least one availability listing (any state)
  const { data: listings } = await admin
    .from('disponibilita')
    .select('user_id, zona, expires_at, is_active')
  const byUser = new Map<string, any[]>()
  for (const l of listings ?? []) {
    if (!byUser.has(l.user_id)) byUser.set(l.user_id, [])
    byUser.get(l.user_id)!.push(l)
  }

  for (const userId of consenting) {
    const userListings = byUser.get(userId) ?? []
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    const email = authUser?.user?.email as string | undefined
    const createdAt = authUser?.user?.created_at as string | undefined
    if (!email || !createdAt) continue

    if (userListings.length === 0) {
      // Email 1: registered 3+ days ago, never published a listing
      if (createdAt < threeDaysAgo) {
        out.push({ user_id: userId, email, template: 'completa-profilo', province: null })
      }
    } else {
      // Email 2: all listings expired and account idle 30+ days
      const allExpired = userListings.every((l) => !l.is_active || l.expires_at < new Date().toISOString())
      if (allExpired && createdAt < thirtyDaysAgo) {
        const zona = userListings[0]?.zona ?? ''
        const province = zona.slice(-2).toUpperCase() || 'ND'
        out.push({ user_id: userId, email, template: 'novita-provincia', province })
      }
    }
  }
  return out
}

export async function runReactivation(): Promise<{ sent: number; skipped: number }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const admin = supabaseAdmin as any

  const candidates = await findCandidates(admin)
  let sent = 0
  let skipped = 0
  const cutoff = new Date(Date.now() - MIN_INTERVAL_DAYS * 24 * 3600 * 1000).toISOString()

  for (const c of candidates) {
    // Rule: max 1 email every 10 days per user
    const { count } = await admin
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', c.user_id)
      .gte('sent_at', cutoff)
    if ((count ?? 0) > 0) { skipped++; continue }

    // Rule: any unsubscribe blocks "completa-profilo" (it has no province)
    if (c.template === 'completa-profilo') {
      const { count: unsub } = await admin
        .from('email_unsubscribes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', c.user_id)
      if ((unsub ?? 0) > 0) { skipped++; continue }
    }

    // Rule: province unsubscribe blocks "novita-provincia" for that province
    if (c.template === 'novita-provincia' && c.province) {
      const { count: unsub } = await admin
        .from('email_unsubscribes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', c.user_id)
        .eq('province', c.province)
      if ((unsub ?? 0) > 0) { skipped++; continue }
    }

    const prov = c.province ?? 'ND'
    const token = await unsubscribeToken(c.user_id, prov)
    const unsubUrl = `${SITE_URL}/api/public/email/disiscrivi?uid=${c.user_id}&prov=${encodeURIComponent(prov)}&t=${token}`

    const content = c.template === 'completa-profilo'
      ? {
          subject: 'Manca solo la zona e sei visibile',
          title: 'Manca solo la zona e sei visibile',
          body: 'Hai creato il tuo account StaffAdvisors, ma non hai ancora pubblicato la tua disponibilità. Bastano 30 secondi: indica il lavoro che cerchi e la tua zona, e chi cerca personale potrà contattarti in privato. È gratis per 15 giorni e puoi ripubblicare gratis quando scade.',
          cta: 'Completa il profilo — 30 sec',
          ctaUrl: `${SITE_URL}/inserisci-disponibilita`,
        }
      : {
          subject: `Novità per chi cerca lavoro in provincia di ${prov}`,
          title: `Novità nella tua zona (${prov})`,
          body: 'La tua disponibilità su StaffAdvisors è scaduta, ma ripubblicarla è gratis e richiede un attimo. Nel frattempo nuove aziende e nuove offerte di lavoro stanno arrivando nella tua zona: dai un\'occhiata e rimettiti in mostra.',
          cta: 'Ripubblica gratis',
          ctaUrl: `${SITE_URL}/account`,
        }

    await sendResend(c.email, content.subject, emailHtml({ ...content, unsubUrl }))
    await admin.from('email_logs').insert({
      user_id: c.user_id,
      email: c.email,
      template: c.template,
      province: c.province,
    })
    sent++
  }
  return { sent, skipped }
}

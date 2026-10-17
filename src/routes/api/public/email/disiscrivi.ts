import { createFileRoute } from '@tanstack/react-router'

function page(title: string, msg: string): Response {
  return new Response(
    `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:40px;max-width:420px;text-align:center;">
    <h1 style="color:#0A1931;font-size:20px;margin:0 0 12px;">${title}</h1>
    <p style="color:#0A1931;font-size:14px;line-height:1.6;margin:0 0 20px;">${msg}</p>
    <a href="https://www.staffadvisors.it" style="color:#FF6B00;font-weight:bold;text-decoration:none;">Torna a StaffAdvisors</a>
  </div>
</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export const Route = createFileRoute('/api/public/email/disiscrivi')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const uid = url.searchParams.get('uid') ?? ''
        const prov = url.searchParams.get('prov') ?? ''
        const token = url.searchParams.get('t') ?? ''
        if (!uid || !prov || !token) {
          return page('Link non valido', 'Il link di disiscrizione non è valido o è incompleto.')
        }
        const { verifyUnsubscribeToken } = await import('@/lib/reactivation.server')
        if (!(await verifyUnsubscribeToken(uid, prov, token))) {
          return page('Link non valido', 'Il link di disiscrizione non è valido o è scaduto.')
        }
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { error } = await (supabaseAdmin as any)
          .from('email_unsubscribes')
          .upsert({ user_id: uid, province: prov }, { onConflict: 'user_id,province' })
        if (error) {
          console.error('Unsubscribe failed:', error)
          return page('Errore', 'Non siamo riusciti a salvare la tua scelta. Riprova più tardi.')
        }
        const msg = prov === 'ND'
          ? 'Abbiamo registrato la tua scelta: non ti manderemo più le email delle novità. Gli avvisi importanti del tuo account (conferme, richieste di contatto) continuano ad arrivare normalmente.'
          : `Abbiamo registrato la tua scelta: non ti manderemo più le novità per la provincia ${prov}. Gli avvisi importanti del tuo account (conferme, richieste di contatto) continuano ad arrivare normalmente.`
        return page('Fatto, non riceverai più queste email', msg)
      },
    },
  },
})

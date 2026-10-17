import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/cron/riattivazione')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // The pg_cron caller presents the project's publishable key. The handler
        // is idempotent: the 10-day rule in email_logs makes replays harmless.
        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        const expected = process.env['SUPABASE_PUBLISHABLE_KEY']
        if (!token || !expected || token !== expected) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const { runReactivation } = await import('@/lib/reactivation.server')
          const result = await runReactivation()
          return Response.json({ ok: true, ...result })
        } catch (err) {
          console.error('Reactivation cron failed:', err)
          return Response.json({ ok: false, error: String(err) }, { status: 500 })
        }
      },
    },
  },
})

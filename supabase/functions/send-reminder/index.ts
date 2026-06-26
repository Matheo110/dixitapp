import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BREVO_KEY = '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'
const SITE_URL = 'https://dixitapp.tech'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch pending invitations with owner profile (auto_reminder check happens here)
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      id, token, client_email, client_name,
      profiles:user_id (company, firstname, auto_reminder)
    `)
    .eq('used', false)
    .eq('reminder_sent', false)
    .lt('created_at', threeDaysAgo)
    .not('client_email', 'is', null)

  if (error) {
    console.error('Query error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0

  for (const inv of invitations ?? []) {
    const profile = (inv as any).profiles

    // Skip if owner opted out of automatic reminders
    if (profile?.auto_reminder === false) {
      skipped++
      continue
    }

    const senderName: string = profile?.company || profile?.firstname || 'Dixitapp'
    const collectLink = `${SITE_URL}/collect/${(inv as any).token}`
    const clientName: string | null = (inv as any).client_name
    const clientEmail: string = (inv as any).client_email

    const greeting = clientName ? `Bonjour ${clientName},` : 'Bonjour,'
    const subject = `Rappel : ${senderName} attend votre témoignage`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-family: Georgia, serif; font-weight: 700; font-size: 22px; letter-spacing: 0.12em; color: #1B2B5E; text-transform: uppercase;">${senderName}</span>
        </div>

        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">${greeting}</p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
          Il y a quelques jours, <strong>${senderName}</strong> vous a invité(e) à laisser un témoignage.
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          Cela ne prend que 2 minutes et votre avis compte beaucoup. Si vous avez déjà répondu, ignorez ce message.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a
            href="${collectLink}"
            style="display: inline-block; background-color: #1B2B5E; color: #F5F0E8; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;"
          >
            Laisser mon témoignage →
          </a>
        </div>

        <p style="color: #888; font-size: 12px; margin-bottom: 4px;">Ou copiez ce lien dans votre navigateur :</p>
        <p style="color: #999; font-size: 11px; word-break: break-all; margin-bottom: 32px;">${collectLink}</p>

        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
          <p style="color: #d0d0d0; font-size: 10px; margin: 0; letter-spacing: 0.03em;">Propulsé par Dixitapp</p>
        </div>
      </div>
    `

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
      body: JSON.stringify({
        sender: { name: senderName, email: 'hello@dixitapp.tech' },
        to: [{ email: clientEmail, name: clientName || undefined }],
        subject,
        htmlContent,
      }),
    })

    if (res.ok) {
      await supabase.from('invitations').update({ reminder_sent: true }).eq('id', (inv as any).id)
      sent++
    } else {
      const body = await res.text()
      console.error(`Reminder failed for invitation ${(inv as any).id}:`, body)
    }
  }

  return new Response(
    JSON.stringify({ sent, skipped, total: (invitations ?? []).length }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record?.user_id) {
      return new Response('Missing record', { status: 400 })
    }

    // Use service role key to look up owner email from auth.users
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(record.user_id)

    if (userError || !userData?.user?.email) {
      console.error('User lookup failed:', userError)
      return new Response('User not found', { status: 404 })
    }

    const ownerEmail = userData.user.email
    const clientName = record.name || 'Un client'

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': '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',
      },
      body: JSON.stringify({
        sender: { name: 'Dixitapp', email: 'no-reply@dixitapp.tech' },
        to: [{ email: ownerEmail }],
        subject: 'Nouveau témoignage reçu sur Dixitapp 🎉',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #1B2B5E; font-size: 20px; margin-bottom: 16px;">Nouveau témoignage reçu 🎉</h2>
            <p style="color: #444; line-height: 1.6;">Bonjour,</p>
            <p style="color: #444; line-height: 1.6;">
              Vous avez reçu un nouveau témoignage de <strong>${clientName}</strong>.
            </p>
            <p style="color: #444; line-height: 1.6;">
              Connectez-vous sur
              <a href="https://dixitapp.tech" style="color: #C8102E;">dixitapp.tech</a>
              pour le consulter et l'approuver.
            </p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              Dixitapp — Collectez des témoignages clients
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Brevo error:', body)
      return new Response('Email failed', { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

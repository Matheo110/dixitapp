const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { client_email, client_name, collect_link, custom_message, owner_name } = await req.json()

    if (!client_email || !collect_link) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const brevoKey = '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'

    const senderName = owner_name || 'Dixitapp'
    const greeting = client_name ? `Bonjour ${client_name},` : 'Bonjour,'
    const bodyMessage = custom_message ||
      `Je serais ravi(e) d'avoir votre avis sur notre collaboration. Cela ne prendra que 2 minutes !`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-family: Georgia, serif; font-weight: 700; font-size: 22px; letter-spacing: 0.12em; color: #1B2B5E; text-transform: uppercase;">DIXITAPP</span>
        </div>

        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">${greeting}</p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">${bodyMessage}</p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a
            href="${collect_link}"
            style="display: inline-block; background-color: #1B2B5E; color: #F5F0E8; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;"
          >
            Laisser mon témoignage →
          </a>
        </div>

        <p style="color: #888; font-size: 12px; line-height: 1.6; margin-bottom: 4px;">
          Ou copiez ce lien dans votre navigateur :
        </p>
        <p style="color: #999; font-size: 11px; word-break: break-all; margin-bottom: 32px;">
          ${collect_link}
        </p>

        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
          <p style="color: #bbb; font-size: 11px; margin: 0;">
            Propulsé par <span style="font-family: Georgia, serif; font-weight: 600; color: #aaa;">Dixitapp</span>
          </p>
        </div>
      </div>
    `

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: 'hello@dixitapp.tech' },
        to: [{ email: client_email, name: client_name || undefined }],
        subject: `${senderName} vous invite à laisser un témoignage`,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Brevo error:', body)
      return new Response(JSON.stringify({ error: 'Email sending failed' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

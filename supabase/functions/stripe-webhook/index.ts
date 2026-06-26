import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRICE_TO_PLAN: Record<string, string> = {
  'price_1TmV3iIBdaudLYGbTTF0OSEq': 'pro',
  'price_1TmV3TIBdaudLYGbI9ykOCHA': 'agency',
}

async function verifySignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const pairs = Object.fromEntries(sigHeader.split(',').map(p => {
    const idx = p.indexOf('=')
    return [p.slice(0, idx), p.slice(idx + 1)]
  }))
  const { t, v1 } = pairs
  if (!t || !v1) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${t}.${body}`))
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return computed === v1
}

Deno.serve(async (req) => {
  try {
    const body = await req.text()
    const sigHeader = req.headers.get('stripe-signature') ?? ''
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return new Response('Webhook not configured', { status: 500 })
    }

    const valid = await verifySignature(body, sigHeader, webhookSecret)
    if (!valid) {
      return new Response('Invalid signature', { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const session = event.data.object
    const customerEmail: string = session.customer_details?.email ?? session.customer_email ?? ''
    const customerId: string = session.customer ?? ''
    const priceId: string = session.metadata?.priceId ?? ''
    const plan = PRICE_TO_PLAN[priceId]

    if (!customerEmail) {
      console.error('No customer email in session', session.id)
      return new Response('Missing customer email', { status: 400 })
    }

    if (!plan) {
      console.error('Unknown priceId:', priceId)
      return new Response('Unknown price', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find user by email
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (usersError) {
      console.error('Error listing users:', usersError)
      return new Response('Error looking up user', { status: 500 })
    }

    const user = users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase())
    if (!user) {
      console.error('No user found for email:', customerEmail)
      return new Response('User not found', { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan,
        stripe_customer_id: customerId,
        is_beta: false,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response('Profile update failed', { status: 500 })
    }

    console.log(`Upgraded user ${user.id} (${customerEmail}) to plan: ${plan}`)

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

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/slug'
import Navbar from '../components/Navbar'
import { useLanguage } from '../context/LanguageContext'

async function getOrCreateProfile(user) {
  const { data } = await supabase
    .from('profiles')
    .select('slug, is_beta, beta_expires_at, plan, company, firstname')
    .eq('id', user.id)
    .single()

  if (data?.slug) return data

  const nameForSlug = data?.firstname || user.user_metadata?.first_name || user.email.split('@')[0]

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug(nameForSlug)

    if (data) {
      const { error } = await supabase.from('profiles').update({ slug }).eq('id', user.id)
      if (!error) return { ...data, slug }
      if (error.code !== '23505') break
    } else {
      const { error } = await supabase.from('profiles').insert({ id: user.id, slug })
      if (!error) return { slug, is_beta: false, beta_expires_at: null, plan: 'free' }
      if (error.code !== '23505') break
    }
  }

  return data || null
}

function hasLimits(profile) {
  if (profile?.is_beta) {
    const betaExpiry = new Date(profile.beta_expires_at || '2026-08-01')
    if (new Date() < betaExpiry) return false
  }
  return profile?.plan === 'free' || !profile?.plan
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [slug, setSlug] = useState(null)
  const [profile, setProfile] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [copied, setCopied] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSent, setInviteSent] = useState(null)
  const [newInviteLink, setNewInviteLink] = useState(null)
  const [copiedInvite, setCopiedInvite] = useState(null)
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (!user) return
    getOrCreateProfile(user).then(p => {
      setSlug(p?.slug || null)
      setProfile(p)
    })
  }, [user])

  const fetchTestimonials = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTestimonials(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTestimonials() }, [fetchTestimonials])

  const fetchInvitations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setInvitations(data || [])
  }, [user])

  useEffect(() => { fetchInvitations() }, [fetchInvitations])

  const handleApprove = async (id, currentlyApproved) => {
    const next = !currentlyApproved
    await supabase.from('testimonials').update({ approved: next }).eq('id', id)
    setTestimonials(prev => prev.map(item => item.id === id ? { ...item, approved: next } : item))
  }

  const handleReject = async (id) => {
    await supabase.from('testimonials').delete().eq('id', id)
    setTestimonials(prev => prev.filter(item => item.id !== id))
  }

  const createInvitation = async () => {
    if (!user) return
    if (hasLimits(profile) && testimonials.length >= 5) {
      setInviteError(t.dash.limitError)
      return
    }
    setInviteLoading(true)
    setInviteError(null)
    setNewInviteLink(null)
    setInviteSent(null)

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        user_id: user.id,
        client_name: clientName.trim() || null,
        client_email: clientEmail.trim() || null,
      })
      .select()
      .single()

    if (error) {
      setInviteError(`Erreur : ${error.message}`)
    } else {
      const link = `${window.location.origin}/collect/${data.token}`
      setNewInviteLink(link)
      setCopiedInvite(null)

      const emailTarget = clientEmail.trim()
      if (emailTarget) {
        console.log('owner_name being sent:', profile?.company, profile?.firstname)
        const { error: emailError } = await supabase.functions.invoke('send-invite', {
          body: {
            client_email: emailTarget,
            client_name: clientName.trim() || null,
            collect_link: link,
            custom_message: inviteMessage.trim() || null,
            owner_name: profile?.company || profile?.firstname || user?.email,
            lang,
          },
        })
        if (emailError) {
          setInviteError(`Lien créé, mais erreur d'envoi : ${emailError.message}`)
        } else {
          setInviteSent(emailTarget)
        }
      }

      setClientName('')
      setClientEmail('')
      setInviteMessage('')
      setInvitations(prev => [data, ...prev])
    }
    setInviteLoading(false)
  }

  const deleteInvitation = async (id) => {
    if (!window.confirm(t.dash.confirmDelete)) return
    await supabase.from('invitations').delete().eq('id', id)
    setInvitations(prev => prev.filter(inv => inv.id !== id))
  }

  const copyCollectLink = () => {
    if (!user) return
    navigator.clipboard.writeText(`${window.location.origin}/collect/${user.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openWall = () => {
    if (!user) return
    window.open(`${window.location.origin}/wall/${user.id}`, '_blank')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const stats = {
    received: testimonials.length,
    approved: testimonials.filter(item => item.approved).length,
    pending: testimonials.filter(item => !item.approved).length,
  }

  const filtered = testimonials.filter(item => {
    if (tab === 'pending') return !item.approved
    if (tab === 'approved') return item.approved
    return true
  })

  const firstName = user?.user_metadata?.first_name

  const planLabel = profile?.plan === 'pro' ? 'Pro' : profile?.plan === 'agency' ? 'Agency' : t.dash.planFree

  const TABS = [
    { key: 'all', label: t.dash.tabAll },
    { key: 'pending', label: t.dash.tabPending },
    { key: 'approved', label: t.dash.tabApproved },
  ]

  const navRight = (
    <div className="flex items-center gap-5">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{planLabel}</span>
      <a
        href="/profile"
        className="text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.65)' }}
        onMouseEnter={e => (e.target.style.color = '#ffffff')}
        onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.65)')}
      >
        {t.nav.myProfile}
      </a>
      <a
        href="/pricing"
        className="text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.65)' }}
        onMouseEnter={e => (e.target.style.color = '#ffffff')}
        onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.65)')}
      >
        {t.nav.seePlans}
      </a>
      <button
        onClick={handleLogout}
        className="text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.65)' }}
        onMouseEnter={e => (e.target.style.color = '#ffffff')}
        onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.65)')}
      >
        {t.nav.logout}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <h2
          className="font-display font-bold text-3xl mb-8"
          style={{ color: '#1B2B5E' }}
        >
          {t.dash.hello}{firstName ? `, ${firstName}` : ''} 👋
        </h2>

        {/* Beta banner */}
        {profile?.is_beta && new Date() < new Date('2026-08-01') && (
          <div style={{ backgroundColor: '#F0F4FF', borderLeft: '3px solid #1B2B5E', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <p style={{ color: '#1B2B5E', fontSize: '0.875rem' }}>
              {t.dash.betaBanner}{' '}
              <a href="/pricing" style={{ color: '#C8102E', fontWeight: '600' }}>{t.dash.betaBannerLink}</a>
            </p>
          </div>
        )}

        {/* Limit banner */}
        {hasLimits(profile) && testimonials.length >= 5 && (
          <div
            className="mb-6 px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#FFF3CD', borderLeft: '3px solid #C8102E' }}
          >
            <p className="text-sm" style={{ color: '#1B2B5E' }}>
              {t.dash.limitBanner}{' '}
              <a href="/pricing" className="font-semibold" style={{ color: '#C8102E' }}>
                {t.dash.limitBannerLink}
              </a>
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { label: t.dash.statsReceived, value: stats.received, color: '#1B2B5E' },
            { label: t.dash.statsApproved, value: stats.approved, color: '#1B2B5E' },
            { label: t.dash.statsPending, value: stats.pending, color: '#C8102E' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 sm:p-6"
              style={{ border: '1px solid rgba(27,43,94,0.1)' }}
            >
              <div className="font-display font-bold text-3xl sm:text-4xl" style={{ color }}>
                {value}
              </div>
              <div className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: 'rgba(27,43,94,0.45)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Invite section */}
        <div className="bg-white mb-8 rounded-2xl" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
          <div className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4" style={{ color: '#1B2B5E' }}>
              {t.dash.inviteTitle}
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder={t.dash.clientFirstName}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ backgroundColor: '#F5F0E8', border: '1.5px solid rgba(27,43,94,0.2)', color: '#1B2B5E' }}
              />
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder={t.dash.clientEmailPlaceholder}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ backgroundColor: '#F5F0E8', border: '1.5px solid rgba(27,43,94,0.2)', color: '#1B2B5E' }}
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(27,43,94,0.55)' }}>
                {t.dash.customMessage} <span style={{ fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={inviteMessage}
                onChange={e => setInviteMessage(e.target.value)}
                rows={3}
                placeholder={t.dash.customMessagePlaceholder}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                style={{ backgroundColor: '#F5F0E8', border: '1.5px solid rgba(27,43,94,0.2)', color: '#1B2B5E' }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button
                onClick={createInvitation}
                disabled={inviteLoading || (hasLimits(profile) && testimonials.length >= 5)}
                className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#C8102E', color: '#ffffff' }}
                onMouseEnter={e => !inviteLoading && (e.currentTarget.style.backgroundColor = '#a80d26')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8102E')}
              >
                {inviteLoading ? t.dash.generating : clientEmail ? t.dash.generateAndSend : t.dash.generateLink}
              </button>
              <button
                onClick={() => user && window.open(`${window.location.origin}/wall/${user.id}`, '_blank')}
                className="px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all"
                style={{ backgroundColor: '#ffffff', border: '1.5px solid #1B2B5E', color: '#1B2B5E' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1B2B5E'; e.currentTarget.style.color = '#F5F0E8' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#1B2B5E' }}
              >
                {t.dash.viewPublicWall}
              </button>
            </div>

            {inviteError && (
              <p className="text-sm mb-3" style={{ color: '#C8102E' }}>{inviteError}</p>
            )}

            {inviteSent && (
              <p className="text-sm mb-3 font-medium" style={{ color: '#1B2B5E' }}>
                {t.dash.inviteSentTo} {inviteSent} ✓
              </p>
            )}

            {newInviteLink && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ backgroundColor: '#F0F4FF', border: '1px solid rgba(27,43,94,0.12)' }}
              >
                <span className="flex-1 text-xs truncate" style={{ color: '#1B2B5E' }}>{newInviteLink}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(newInviteLink); setCopiedInvite('new'); setTimeout(() => setCopiedInvite(null), 2000) }}
                  className="text-xs px-3 py-1.5 rounded-lg shrink-0 transition-all"
                  style={copiedInvite === 'new' ? { backgroundColor: 'rgba(27,43,94,0.12)', color: '#1B2B5E' } : { backgroundColor: '#1B2B5E', color: '#F5F0E8' }}
                >
                  {copiedInvite === 'new' ? t.dash.copied : t.dash.copy}
                </button>
              </div>
            )}

            {invitations.filter(inv => !inv.used).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'rgba(27,43,94,0.4)' }}>
                  {t.dash.sentLinks}
                </p>
                <div className="space-y-2">
                  {invitations.filter(inv => !inv.used).map(inv => {
                    const link = `${window.location.origin}/collect/${inv.token}`
                    return (
                      <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#F5F0E8' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: '#1B2B5E' }}>
                            {inv.client_name || inv.client_email || t.dash.noName}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'rgba(27,43,94,0.4)' }}>{link}</p>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={inv.used
                            ? { backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' }
                            : { backgroundColor: 'rgba(200,16,46,0.1)', color: '#C8102E' }}
                        >
                          {inv.used ? t.dash.statusUsed : t.dash.statusPending}
                        </span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(link); setCopiedInvite(inv.id); setTimeout(() => setCopiedInvite(null), 2000) }}
                          className="text-xs px-2.5 py-1.5 rounded-lg shrink-0 transition-all"
                          style={copiedInvite === inv.id
                            ? { backgroundColor: 'rgba(27,43,94,0.12)', color: '#1B2B5E' }
                            : { backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' }}
                        >
                          {copiedInvite === inv.id ? t.dash.copied : t.dash.copy}
                        </button>
                        <button
                          onClick={() => deleteInvitation(inv.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg shrink-0 transition-all"
                          style={{ backgroundColor: 'transparent', border: '1px solid #C8102E', color: '#C8102E' }}
                        >
                          {t.dash.delete}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Testimonials list */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3
              className="font-display font-semibold text-xl"
              style={{ color: '#1B2B5E' }}
            >
              {t.dash.testimonialsTitle}
            </h3>
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ backgroundColor: '#ffffff', border: '1px solid rgba(27,43,94,0.1)' }}
            >
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                  style={
                    tab === key
                      ? { backgroundColor: '#1B2B5E', color: '#ffffff' }
                      : { color: 'rgba(27,43,94,0.5)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-sm" style={{ color: 'rgba(27,43,94,0.35)' }}>
              {t.dash.loadingText}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div className="grid gap-3">
              {filtered.map(item => (
                <TestimonialCard
                  key={item.id}
                  testimonial={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{ backgroundColor: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.5rem' }}>·</span>
        <a href="/cgv" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>CGV</a>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/mentions" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>Mentions légales</a>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/privacy" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>Confidentialité</a>
      </footer>
    </div>
  )
}

function EmptyState({ tab }) {
  const { t } = useLanguage()
  const messages = {
    all: t.dash.emptyAll,
    pending: t.dash.emptyPending,
    approved: t.dash.emptyApproved,
  }
  const { title, sub } = messages[tab]
  return (
    <div className="text-center py-20">
      <p className="font-display text-xl" style={{ color: 'rgba(27,43,94,0.4)' }}>{title}</p>
      <p className="text-sm mt-2" style={{ color: 'rgba(27,43,94,0.3)' }}>{sub}</p>
    </div>
  )
}

function TestimonialCard({ testimonial, onApprove, onReject }) {
  const { t, lang } = useLanguage()
  const [rejecting, setRejecting] = useState(false)
  const initials = testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const date = new Date(testimonial.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div
      className="bg-white rounded-2xl p-5 sm:p-6 transition-all"
      style={{
        border: testimonial.approved ? '1px solid rgba(27,43,94,0.1)' : '1px solid rgba(200,16,46,0.2)',
        borderLeft: testimonial.approved ? undefined : '3px solid #C8102E',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 select-none"
          style={{ backgroundColor: '#1B2B5E' }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
            <span className="font-semibold text-sm" style={{ color: '#1B2B5E' }}>{testimonial.name}</span>
            {(testimonial.role || testimonial.company) && (
              <span className="text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>
                {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}
              </span>
            )}
            {!testimonial.approved && (
              <span
                className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(200,16,46,0.1)', color: '#C8102E' }}
              >
                {t.dash.statusPending}
              </span>
            )}
          </div>

          {testimonial.rating && (
            <div className="flex gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-sm" style={{ color: i < testimonial.rating ? '#C8102E' : 'rgba(27,43,94,0.15)' }}>
                  ★
                </span>
              ))}
            </div>
          )}

          {testimonial.video_url ? (
            <video
              src={testimonial.video_url}
              controls
              playsInline
              className="w-full rounded-xl mb-2"
              style={{ maxHeight: '300px', backgroundColor: '#000' }}
            />
          ) : testimonial.message === '[Témoignage vidéo]' ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2"
              style={{ backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' }}
            >
              {t.dash.videoTag}
            </span>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(27,43,94,0.65)' }}>
              {testimonial.message}
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => onApprove(testimonial.id, testimonial.approved)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={
                testimonial.approved === true
                  ? { backgroundColor: 'rgba(200,16,46,0.08)', color: '#C8102E' }
                  : { backgroundColor: '#1B2B5E', color: '#ffffff' }
              }
            >
              {testimonial.approved === true ? t.dash.unapprove : t.dash.approve}
            </button>
            <button
              onClick={() => { setRejecting(true); onReject(testimonial.id) }}
              disabled={rejecting}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{ color: 'rgba(200,16,46,0.6)' }}
              onMouseEnter={e => (e.target.style.backgroundColor = 'rgba(200,16,46,0.08)')}
              onMouseLeave={e => (e.target.style.backgroundColor = 'transparent')}
            >
              {t.dash.reject}
            </button>
            <span className="text-xs ml-auto" style={{ color: 'rgba(27,43,94,0.3)' }}>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

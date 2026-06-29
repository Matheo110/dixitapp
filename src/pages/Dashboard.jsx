import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/slug'
import Navbar from '../components/Navbar'
import { useLanguage } from '../context/LanguageContext'

async function getOrCreateProfile(user) {
  const { data } = await supabase
    .from('profiles')
    .select('slug, is_beta, beta_expires_at, plan, company, firstname, auto_reminder')
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
  const [showStats, setShowStats] = useState(false)
  const [autoReminder, setAutoReminder] = useState(true)
  const [copiedEmbed, setCopiedEmbed] = useState(null)
  const [showEmbed, setShowEmbed] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const exportRef = useRef(null)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const navMenuRef = useRef(null)
  const [copiedInvite, setCopiedInvite] = useState(null)
  const [unseenCount, setUnseenCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
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

    const lastVisit = localStorage.getItem('dixitapp_last_visit')
    if (lastVisit) {
      const cutoff = new Date(lastVisit)
      const unseen = (data || []).filter(t => new Date(t.created_at) > cutoff).length
      setUnseenCount(unseen)
    }
    localStorage.setItem('dixitapp_last_visit', new Date().toISOString())

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

  // Real-time: new testimonials
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`testimonials-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'testimonials', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setTestimonials(prev => [payload.new, ...prev])
          setUnseenCount(c => c + 1)
          setShowToast(true)
          setTimeout(() => setShowToast(false), 4000)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Sync auto_reminder from profile once loaded
  useEffect(() => {
    if (profile && profile.auto_reminder !== undefined) {
      setAutoReminder(profile.auto_reminder !== false)
    }
  }, [profile])

  const toggleAutoReminder = async (value) => {
    setAutoReminder(value)
    if (user) {
      await supabase.from('profiles').update({ auto_reminder: value }).eq('id', user.id)
    }
  }

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
    const id = slug || user?.id
    if (!id) return
    navigator.clipboard.writeText(`${window.location.origin}/collect/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close nav hamburger menu on outside click
  useEffect(() => {
    if (!showNavMenu) return
    const navHandler = (e) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target)) setShowNavMenu(false)
    }
    document.addEventListener('mousedown', navHandler)
    return () => document.removeEventListener('mousedown', navHandler)
  }, [showNavMenu])

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return
    const handle = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showExport])

  const csvEscape = (val) => {
    const s = String(val ?? '')
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const exportCSV = () => {
    const isEn = lang === 'en'
    const headers = isEn
      ? ['First name', 'Rating', 'Testimonial', 'Date', 'Status']
      : ['Prénom', 'Note', 'Témoignage', 'Date', 'Statut']
    const rows = filtered.map(item => [
      csvEscape(item.name),
      csvEscape(item.rating || ''),
      csvEscape(item.message || ''),
      csvEscape(new Date(item.created_at).toLocaleDateString(isEn ? 'en-US' : 'fr-FR')),
      csvEscape(item.approved ? (isEn ? 'Approved' : 'Approuvé') : (isEn ? 'Pending' : 'En attente')),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dixitapp-temoignages.csv'
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const exportPDF = () => {
    const isEn = lang === 'en'
    const companyName = profile?.company || profile?.firstname || 'Dixitapp'
    const cards = filtered.map(item => {
      const stars = item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : ''
      const date = new Date(item.created_at).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      return `
        <div style="border:1px solid #E0D8CC;border-radius:8px;padding:1rem 1.25rem;margin-bottom:1rem;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
            <strong style="color:#1B2B5E;font-size:0.95rem;">${item.name}</strong>
            <span style="font-size:0.75rem;color:#888;">${date}</span>
          </div>
          ${stars ? `<div style="color:#C8102E;font-size:1rem;margin-bottom:0.4rem;">${stars}</div>` : ''}
          <p style="color:#444;font-size:0.875rem;line-height:1.6;margin:0;">${item.message || (isEn ? '(Video testimonial)' : '(Témoignage vidéo)')}</p>
        </div>`
    }).join('')
    const title = isEn ? 'Testimonials' : 'Témoignages'
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${companyName} — ${title}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:2rem 2.5rem;color:#1B2B5E;max-width:800px;margin:0 auto;}
        h1{font-size:1.5rem;margin-bottom:0.25rem;}
        .sub{color:#888;font-size:0.85rem;margin-bottom:1.5rem;}
        @media print{@page{margin:1.5cm;}}
      </style></head>
      <body>
        <h1>${companyName}</h1>
        <p class="sub">${title} — ${filtered.length} ${isEn ? 'result(s)' : 'résultat(s)'}</p>
        ${cards}
      </body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
    setShowExport(false)
  }

  const openWall = () => {
    const id = slug || user?.id
    if (!id) return
    window.open(`${window.location.origin}/wall/${id}`, '_blank')
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

  const responseRate = invitations.length > 0
    ? Math.round((invitations.filter(inv => inv.used).length / invitations.length) * 100)
    : 0

  const ratedItems = testimonials.filter(item => item.approved && item.rating)
  const avgRating = ratedItems.length > 0
    ? ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length
    : 0

  const weeklyData = useMemo(() => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    return Array.from({ length: 8 }, (_, i) => {
      const weeksAgo = 7 - i
      const weekEnd = new Date(now.getTime() - weeksAgo * 7 * 86400000)
      const weekStart = new Date(weekEnd.getTime() - 7 * 86400000)
      weekStart.setHours(0, 0, 0, 0)
      const count = testimonials.filter(item => {
        const d = new Date(item.created_at)
        return d >= weekStart && d <= weekEnd
      }).length
      const label = weekStart.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'short', day: 'numeric' })
      return { week: label, count }
    })
  }, [testimonials, lang])

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
    <div className="flex items-center gap-4">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{planLabel}</span>
      <a
        href="/pricing"
        className="text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.65)' }}
        onMouseEnter={e => (e.target.style.color = '#ffffff')}
        onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.65)')}
      >
        {t.nav.seePlans}
      </a>

      {/* Hamburger menu */}
      <div style={{ position: 'relative' }} ref={navMenuRef}>
        <button
          onClick={() => setShowNavMenu(s => !s)}
          aria-label="Menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="#F5F0E8">
            <rect width="22" height="2" rx="1"/>
            <rect y="7" width="22" height="2" rx="1"/>
            <rect y="14" width="22" height="2" rx="1"/>
          </svg>
        </button>

        {showNavMenu && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: '#ffffff', border: '1px solid #E0D8CC', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '210px', zIndex: 50, overflow: 'hidden' }}>

            <button
              onClick={() => { setShowNavMenu(false); navigate('/profile') }}
              style={{ display: 'block', width: '100%', padding: '0.75rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#1B2B5E' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {lang === 'en' ? 'My profile' : 'Mon profil'}
            </button>

            <button
              onClick={() => { setShowNavMenu(false); navigate('/customize') }}
              style={{ display: 'block', width: '100%', padding: '0.75rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#1B2B5E' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {lang === 'en' ? 'Customize my wall' : 'Personnaliser mon mur'}
            </button>

            <button
              onClick={() => { setShowNavMenu(false); navigate('/customize-collect') }}
              style={{ display: 'block', width: '100%', padding: '0.75rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#1B2B5E' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {lang === 'en' ? 'Customize collect page' : 'Personnaliser ma page de collecte'}
            </button>

            <div style={{ height: '1px', backgroundColor: '#E0D8CC' }} />

            <button
              onClick={() => { setShowNavMenu(false); handleLogout() }}
              style={{ display: 'block', width: '100%', padding: '0.75rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#1B2B5E' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {lang === 'en' ? 'Logout' : 'Déconnexion'}
            </button>

          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <style>{`
        @keyframes statsReveal {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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

        {/* Toggle buttons row */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowStats(s => !s)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(27,43,94,0.2)',
              color: '#1B2B5E',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,43,94,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {showStats
              ? (lang === 'en' ? 'Hide statistics ▲' : 'Masquer les statistiques ▲')
              : (lang === 'en' ? 'Show statistics ▼' : 'Voir les statistiques ▼')}
          </button>
          {user && (
          <button
            onClick={() => setShowEmbed(s => !s)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(27,43,94,0.2)',
              color: '#1B2B5E',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,43,94,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {showEmbed
              ? (lang === 'en' ? 'Hide ▲' : 'Masquer ▲')
              : (lang === 'en' ? 'Embed on my website ▼' : 'Intégrer sur mon site ▼')}
          </button>
          )}
        </div>

        {showStats && (
          <div style={{ animation: 'statsReveal 0.3s ease both' }}>

          {/* Response rate + avg rating cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">

            {/* Response rate */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
              <div className="text-xs mb-3 leading-snug" style={{ color: 'rgba(27,43,94,0.45)' }}>
                {t.dash.responseRate}
              </div>
              <div className="flex items-center gap-4">
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(27,43,94,0.1)" strokeWidth="6" />
                  <circle
                    cx="36" cy="36" r="28" fill="none"
                    stroke="#1B2B5E" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - responseRate / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <text x="36" y="41" textAnchor="middle" fill="#1B2B5E" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">
                    {responseRate}%
                  </text>
                </svg>
                <div>
                  <div className="font-display font-bold text-2xl" style={{ color: '#1B2B5E' }}>
                    {invitations.filter(inv => inv.used).length}
                    <span className="text-sm font-normal" style={{ color: 'rgba(27,43,94,0.4)' }}>
                      /{invitations.length}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(27,43,94,0.4)' }}>
                    {lang === 'en' ? 'invitations used' : 'invitations utilisées'}
                  </div>
                </div>
              </div>
            </div>

            {/* Average rating */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
              <div className="text-xs mb-3 leading-snug" style={{ color: 'rgba(27,43,94,0.45)' }}>
                {t.dash.avgRating}
              </div>
              <div className="font-display font-bold text-4xl" style={{ color: '#C8102E' }}>
                {ratedItems.length > 0 ? avgRating.toFixed(1) : '—'}
                {ratedItems.length > 0 && (
                  <span className="text-lg font-normal" style={{ color: 'rgba(27,43,94,0.35)' }}> / 5</span>
                )}
              </div>
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < Math.round(avgRating) ? '#C8102E' : 'rgba(27,43,94,0.15)', fontSize: '1rem' }}>★</span>
                ))}
              </div>
              <div className="text-xs mt-1.5" style={{ color: 'rgba(27,43,94,0.4)' }}>
                {ratedItems.length} {lang === 'en' ? 'rated review(s)' : 'avis notés'}
              </div>
            </div>
          </div>

          {/* Weekly chart */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
            <p className="text-sm font-medium mb-4" style={{ color: 'rgba(27,43,94,0.5)' }}>
              {t.dash.chartTitle}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,43,94,0.06)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: 'rgba(27,43,94,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'rgba(27,43,94,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(27,43,94,0.12)',
                    fontSize: '12px',
                    color: '#1B2B5E',
                  }}
                  formatter={(value) => [value, lang === 'en' ? 'Testimonials' : 'Témoignages']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1B2B5E"
                  strokeWidth={2.5}
                  dot={{ fill: '#C8102E', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#C8102E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          </div>
          )}

        {user && showEmbed && (
          <div className="bg-white rounded-2xl mb-8" style={{ border: '1px solid rgba(27,43,94,0.1)', animation: 'statsReveal 0.3s ease both' }}>
            <div className="p-6">
              <h3 className="font-display font-semibold text-lg mb-1" style={{ color: '#1B2B5E' }}>
                {lang === 'en' ? 'Embed on my website' : 'Intégrer sur mon site'}
              </h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(27,43,94,0.5)' }}>
                {lang === 'en'
                  ? 'Copy this code and paste it on your website to display your testimonials automatically'
                  : 'Copiez ce code et collez-le sur votre site pour afficher vos témoignages automatiquement'}
              </p>

              {/* iFrame option */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(27,43,94,0.4)' }}>
                  iFrame <span style={{ color: '#C8102E' }}>({lang === 'en' ? 'recommended' : 'recommandé'})</span>
                </p>
                <div className="flex items-start gap-2">
                  <div className="flex-1 rounded-lg overflow-x-auto" style={{ backgroundColor: '#1B2B5E', padding: '1rem', borderRadius: '8px' }}>
                    <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#F5F0E8', whiteSpace: 'pre', display: 'block' }}>
                      {`<iframe src="https://dixitapp.tech/wall/${slug || user.id}" width="100%" height="600px" frameborder="0" style="border:none;border-radius:12px;"></iframe>`}
                    </code>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`<iframe src="https://dixitapp.tech/wall/${slug || user.id}" width="100%" height="600px" frameborder="0" style="border:none;border-radius:12px;"></iframe>`); setCopiedEmbed('iframe'); setTimeout(() => setCopiedEmbed(null), 2000) }}
                    className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-all"
                    style={copiedEmbed === 'iframe' ? { backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' } : { backgroundColor: '#1B2B5E', color: '#F5F0E8' }}
                  >
                    {copiedEmbed === 'iframe' ? (lang === 'en' ? 'Copied ✓' : 'Copié ✓') : (lang === 'en' ? 'Copy' : 'Copier')}
                  </button>
                </div>
              </div>

              {/* Direct link option */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(27,43,94,0.4)' }}>
                  {lang === 'en' ? 'Direct link' : 'Lien direct'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg overflow-x-auto" style={{ backgroundColor: '#1B2B5E', padding: '1rem', borderRadius: '8px' }}>
                    <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#F5F0E8', whiteSpace: 'nowrap', display: 'block' }}>
                      {`https://dixitapp.tech/wall/${slug || user.id}`}
                    </code>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`https://dixitapp.tech/wall/${slug || user.id}`); setCopiedEmbed('link'); setTimeout(() => setCopiedEmbed(null), 2000) }}
                    className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-all"
                    style={copiedEmbed === 'link' ? { backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' } : { backgroundColor: '#1B2B5E', color: '#F5F0E8' }}
                  >
                    {copiedEmbed === 'link' ? (lang === 'en' ? 'Copied ✓' : 'Copié ✓') : (lang === 'en' ? 'Copy' : 'Copier')}
                  </button>
                </div>
              </div>

              {/* CMS note */}
              <p className="text-xs" style={{ color: 'rgba(27,43,94,0.35)' }}>
                💡 {lang === 'en'
                  ? 'Compatible with WordPress, Wix, Squarespace and all CMS'
                  : 'Compatible avec WordPress, Wix, Squarespace et tous les CMS'}
              </p>
            </div>
          </div>
        )}

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

            {/* Auto reminder toggle */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => toggleAutoReminder(!autoReminder)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  backgroundColor: autoReminder ? '#1B2B5E' : 'rgba(27,43,94,0.15)',
                  position: 'relative', flexShrink: 0,
                  transition: 'background-color 0.2s ease',
                }}
                aria-label="Toggle auto reminder"
              >
                <div style={{
                  position: 'absolute', top: 3, width: 18, height: 18,
                  borderRadius: '50%', backgroundColor: '#ffffff',
                  left: autoReminder ? 23 : 3,
                  transition: 'left 0.2s ease',
                }} />
              </button>
              <span style={{ fontSize: '0.82rem', color: 'rgba(27,43,94,0.6)', lineHeight: 1.4 }}>
                {lang === 'en'
                  ? 'Send automatic reminder after 3 days'
                  : 'Envoyer un rappel automatique après 3 jours'}
              </span>
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
                onClick={openWall}
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
              style={{ color: '#1B2B5E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {t.dash.testimonialsTitle}
              {unseenCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#C8102E', color: '#ffffff', borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3">
              {/* Export dropdown */}
              <div style={{ position: 'relative' }} ref={exportRef}>
                <button
                  onClick={() => setShowExport(s => !s)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: '#ffffff', border: '1px solid rgba(27,43,94,0.2)', color: '#1B2B5E', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F0E8')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  {lang === 'en' ? 'Export ▼' : 'Exporter ▼'}
                </button>
                {showExport && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, backgroundColor: '#ffffff', border: '1px solid #E0D8CC', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 10, overflow: 'hidden' }}>
                    {[
                      { key: 'csv', label: lang === 'en' ? 'Export as CSV' : 'Exporter en CSV', action: exportCSV },
                      { key: 'pdf', label: lang === 'en' ? 'Export as PDF' : 'Exporter en PDF', action: exportPDF },
                    ].map(({ key, label, action }) => (
                      <button
                        key={key}
                        onClick={action}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#1B2B5E' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F0E8')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Tabs */}
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

      {/* ── TOAST ── */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', backgroundColor: '#1B2B5E', color: '#ffffff', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 60, fontSize: '0.9rem', fontWeight: 500, borderLeft: '3px solid #C8102E', animation: 'toastIn 0.3s ease', maxWidth: '320px' }}>
          {t.dash.newTestimonialToast}
        </div>
      )}
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

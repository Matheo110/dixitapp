import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/slug'
import Navbar from '../components/Navbar'

async function getOrCreateProfile(user) {
  const { data } = await supabase
    .from('profiles')
    .select('slug')
    .eq('id', user.id)
    .single()

  if (data) return data.slug

  const firstName = user.user_metadata?.first_name || user.email.split('@')[0]

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug(firstName)
    const { error } = await supabase.from('profiles').insert({ id: user.id, slug })
    if (!error) return slug
    if (error.code !== '23505') break // not a unique-constraint collision
  }

  return null
}

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Approuvés' },
]

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [slug, setSlug] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (!user) return
    getOrCreateProfile(user).then(setSlug)
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

  const handleApprove = async (id, currentlyApproved) => {
    const next = !currentlyApproved
    await supabase.from('testimonials').update({ approved: next }).eq('id', id)
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved: next } : t))
  }

  const handleReject = async (id) => {
    await supabase.from('testimonials').delete().eq('id', id)
    setTestimonials(prev => prev.filter(t => t.id !== id))
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
    approved: testimonials.filter(t => t.approved).length,
    pending: testimonials.filter(t => !t.approved).length,
  }

  const filtered = testimonials.filter(t => {
    if (tab === 'pending') return !t.approved
    if (tab === 'approved') return t.approved
    return true
  })

  const firstName = user?.user_metadata?.first_name

  const navRight = (
    <button
      onClick={handleLogout}
      className="text-sm font-medium transition-colors"
      style={{ color: 'rgba(255,255,255,0.65)' }}
      onMouseEnter={e => (e.target.style.color = '#ffffff')}
      onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.65)')}
    >
      Déconnexion
    </button>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Welcome */}
        <h2
          className="font-display font-bold text-3xl mb-8"
          style={{ color: '#1B2B5E' }}
        >
          Bonjour{firstName ? `, ${firstName}` : ''} 👋
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Témoignages reçus', value: stats.received, color: '#1B2B5E' },
            { label: 'Témoignages approuvés', value: stats.approved, color: '#1B2B5E' },
            { label: 'En attente', value: stats.pending, color: '#C8102E' },
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

        {/* Collect link */}
        {user && (
          <div
            className="bg-white mb-8"
            style={{
              borderLeft: '3px solid #C8102E',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h3
              className="font-display font-semibold text-lg mb-4"
              style={{ color: '#1B2B5E' }}
            >
              Mon lien de collecte
            </h3>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                readOnly
                value={`${window.location.origin}/collect/${user.id}`}
                className="flex-1 text-xs px-3 py-3 rounded-xl outline-none truncate"
                style={{
                  backgroundColor: '#F5F0E8',
                  color: 'rgba(27,43,94,0.7)',
                  border: '1px solid rgba(27,43,94,0.12)',
                }}
                onFocus={e => e.target.select()}
              />

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={copyCollectLink}
                  className="flex-1 sm:flex-none text-xs font-semibold px-4 py-3 rounded-xl transition-all whitespace-nowrap"
                  style={
                    copied
                      ? { backgroundColor: 'rgba(27,43,94,0.12)', color: '#1B2B5E' }
                      : { backgroundColor: '#1B2B5E', color: '#F5F0E8' }
                  }
                >
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>

                <button
                  onClick={openWall}
                  className="flex-1 sm:flex-none text-xs font-semibold px-4 py-3 rounded-xl transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#C8102E',
                    border: '1.5px solid #C8102E',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#C8102E'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.color = '#C8102E'
                  }}
                >
                  Voir mon mur public
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Testimonials list */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3
              className="font-display font-semibold text-xl"
              style={{ color: '#1B2B5E' }}
            >
              Témoignages
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
              Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div className="grid gap-3">
              {filtered.map(t => (
                <TestimonialCard
                  key={t.id}
                  testimonial={t}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function EmptyState({ tab }) {
  const messages = {
    all: { title: 'Aucun témoignage pour le moment', sub: 'Partagez votre lien de collecte pour commencer.' },
    pending: { title: 'Aucun témoignage en attente', sub: 'Tout est à jour !' },
    approved: { title: 'Aucun témoignage approuvé', sub: 'Approuvez les témoignages reçus pour les afficher sur votre mur.' },
  }
  const { title, sub } = messages[tab]
  return (
    <div className="text-center py-20">
      <p className="font-display text-xl" style={{ color: 'rgba(27,43,94,0.4)' }}>{title}</p>
      <p className="text-sm mt-2" style={{ color: 'rgba(27,43,94,0.3)' }}>{sub}</p>
    </div>
  )
}

function TestimonialCard({ testimonial: t, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false)
  const initials = t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const date = new Date(t.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div
      className="bg-white rounded-2xl p-5 sm:p-6 transition-all"
      style={{
        border: t.approved ? '1px solid rgba(27,43,94,0.1)' : '1px solid rgba(200,16,46,0.2)',
        borderLeft: t.approved ? undefined : '3px solid #C8102E',
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
            <span className="font-semibold text-sm" style={{ color: '#1B2B5E' }}>{t.name}</span>
            {(t.role || t.company) && (
              <span className="text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>
                {[t.role, t.company].filter(Boolean).join(' · ')}
              </span>
            )}
            {!t.approved && (
              <span
                className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(200,16,46,0.1)', color: '#C8102E' }}
              >
                En attente
              </span>
            )}
          </div>

          {t.rating && (
            <div className="flex gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-sm" style={{ color: i < t.rating ? '#C8102E' : 'rgba(27,43,94,0.15)' }}>
                  ★
                </span>
              ))}
            </div>
          )}

          {t.video_url ? (
            <video
              src={t.video_url}
              controls
              playsInline
              className="w-full rounded-xl mb-2"
              style={{ maxHeight: '300px', backgroundColor: '#000' }}
            />
          ) : t.message === '[Témoignage vidéo]' ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2"
              style={{ backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' }}
            >
              🎥 Témoignage vidéo
            </span>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(27,43,94,0.65)' }}>
              {t.message}
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => onApprove(t.id, t.approved)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={
                t.approved === true
                  ? { backgroundColor: 'rgba(200,16,46,0.08)', color: '#C8102E' }
                  : { backgroundColor: '#1B2B5E', color: '#ffffff' }
              }
            >
              {t.approved === true ? 'Désapprouver' : 'Approuver'}
            </button>
            <button
              onClick={() => { setRejecting(true); onReject(t.id) }}
              disabled={rejecting}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{ color: 'rgba(200,16,46,0.6)' }}
              onMouseEnter={e => (e.target.style.backgroundColor = 'rgba(200,16,46,0.08)')}
              onMouseLeave={e => (e.target.style.backgroundColor = 'transparent')}
            >
              Rejeter
            </button>
            <span className="text-xs ml-auto" style={{ color: 'rgba(27,43,94,0.3)' }}>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

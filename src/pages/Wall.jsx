import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const FONT_FAMILY = {
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'Inter': "'Inter', sans-serif",
  'Georgia': 'Georgia, serif',
  'Arial': 'Arial, sans-serif',
}

export default function Wall() {
  const { slug } = useParams()
  const [testimonials, setTestimonials] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', slug)
        .eq('approved', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('wall_bg_color, wall_primary_color, wall_accent_color, wall_font, wall_title, wall_layout, company, firstname')
        .eq('id', slug)
        .single(),
    ]).then(([{ data: tData, error }, { data: pData }]) => {
      if (error) { setNotFound(true); setLoading(false); return }
      setTestimonials(tData || [])
      setProfile(pData)
      setLoading(false)
    })
  }, [slug])

  const bg      = profile?.wall_bg_color      || '#F5F0E8'
  const primary = profile?.wall_primary_color  || '#1B2B5E'
  const accent  = profile?.wall_accent_color   || '#C8102E'
  const font    = FONT_FAMILY[profile?.wall_font] || FONT_FAMILY['Playfair Display']
  const title   = profile?.wall_title          || 'Témoignages de nos clients'
  const layout  = profile?.wall_layout         || 'grid'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <span className="text-sm" style={{ color: `${primary}66` }}>Chargement…</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
        <div className="text-center">
          <p style={{ fontFamily: font, fontSize: '1.5rem', fontWeight: 700, color: primary, marginBottom: '0.5rem' }}>
            Page introuvable
          </p>
          <p className="text-sm" style={{ color: `${primary}80` }}>Ce lien est invalide ou a expiré.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>

      {/* Header */}
      <header style={{ backgroundColor: primary, padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: font, fontWeight: 700, color: bg, letterSpacing: '0.1em', fontSize: '1.1rem', textTransform: 'uppercase' }}>
            {profile?.company || 'DIXITAPP'}
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center pt-14 pb-10 px-4">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: accent }}
        >
          Avis clients
        </p>
        <h1
          style={{ fontFamily: font, fontWeight: 700, color: primary, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.2 }}
        >
          {title}
        </h1>
        <div
          className="mx-auto mt-6 rounded-full"
          style={{ width: 48, height: 3, backgroundColor: accent }}
        />
      </div>

      {/* Testimonials */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16">
        {testimonials.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ fontFamily: font, fontSize: '1.1rem', color: `${primary}55` }}>
              Aucun témoignage pour le moment.
            </p>
          </div>
        ) : layout === 'list' ? (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {testimonials.map(t => (
              <WallCard key={t.id} testimonial={t} primary={primary} accent={accent} font={font} />
            ))}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {testimonials.map(t => (
              <WallCard key={t.id} testimonial={t} primary={primary} accent={accent} font={font} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="text-center py-6"
        style={{ borderTop: `1px solid ${primary}18` }}
      >
        <p className="text-xs" style={{ color: `${primary}40` }}>
          Propulsé par{' '}
          <span style={{ fontFamily: font, fontWeight: 600, color: `${primary}60` }}>
            Dixitapp
          </span>
        </p>
      </footer>
    </div>
  )
}

function WallCard({ testimonial: t, primary, accent, font }) {
  const initials = t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="break-inside-avoid mb-5">
      <div
        className="bg-white rounded-2xl p-6 transition-all duration-200"
        style={{
          border: `1px solid ${primary}18`,
          boxShadow: `0 1px 3px ${primary}0f`,
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 24px ${primary}1e`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 1px 3px ${primary}0f`)}
      >
        {!t.video_url && t.message !== '[Témoignage vidéo]' && (
          <div
            style={{ fontFamily: font, fontSize: '4rem', lineHeight: 1, marginBottom: '0.5rem', color: `${accent}30`, userSelect: 'none' }}
            aria-hidden="true"
          >
            "
          </div>
        )}

        {t.video_url ? (
          <video
            src={t.video_url}
            controls
            playsInline
            className="w-full rounded-xl mb-4"
            style={{ backgroundColor: '#000' }}
          />
        ) : t.message === '[Témoignage vidéo]' ? (
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-4"
            style={{ backgroundColor: `${primary}12`, color: primary }}
          >
            🎥 Témoignage vidéo
          </span>
        ) : (
          <p className="text-sm leading-relaxed mb-4" style={{ color: `${primary}b3` }}>
            {t.message}
          </p>
        )}

        {t.rating && (
          <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-sm" style={{ color: i < t.rating ? accent : `${primary}26` }}>★</span>
            ))}
          </div>
        )}

        <div
          className="flex items-center gap-3 pt-4"
          style={{ borderTop: `1px solid ${primary}12` }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none"
            style={{ backgroundColor: primary }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: primary }}>
              {t.name}
            </div>
            {(t.role || t.company) && (
              <div className="text-xs truncate" style={{ color: `${primary}66` }}>
                {[t.role, t.company].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

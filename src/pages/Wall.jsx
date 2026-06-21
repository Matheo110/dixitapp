import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function Wall() {
  const { slug } = useParams()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', slug)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setNotFound(true); setLoading(false); return }
        setTestimonials(data || [])
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'rgba(27,43,94,0.35)' }}>Chargement…</span>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="font-display text-2xl font-bold mb-2" style={{ color: '#1B2B5E' }}>
              Page introuvable
            </p>
            <p className="text-sm" style={{ color: 'rgba(27,43,94,0.5)' }}>
              Ce lien est invalide ou a expiré.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar />

      {/* Hero */}
      <div className="text-center pt-16 pb-12 px-4">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#C8102E' }}
        >
          Avis clients
        </p>
        <h1
          className="font-display font-bold leading-tight"
          style={{ color: '#1B2B5E', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)' }}
        >
          Témoignages de{' '}
          <span style={{ fontStyle: 'italic' }}>nos clients</span>
        </h1>
        <div
          className="mx-auto mt-7 rounded-full"
          style={{ width: 48, height: 3, backgroundColor: '#C8102E' }}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16">
        {testimonials.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl" style={{ color: 'rgba(27,43,94,0.35)' }}>
              Aucun témoignage pour le moment.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {testimonials.map(t => (
              <WallCard key={t.id} testimonial={t} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="text-center py-7"
        style={{ borderTop: '1px solid rgba(27,43,94,0.1)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(27,43,94,0.3)' }}>
          Propulsé par{' '}
          <span
            className="font-display font-semibold tracking-wider"
            style={{ color: 'rgba(27,43,94,0.5)' }}
          >
            Dixitapp
          </span>
        </p>
      </footer>
    </div>
  )
}

function WallCard({ testimonial: t }) {
  const initials = t.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="break-inside-avoid mb-5">
      <div
        className="bg-white rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
        style={{
          border: '1px solid rgba(27,43,94,0.1)',
          boxShadow: '0 1px 3px rgba(27,43,94,0.06)',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(27,43,94,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(27,43,94,0.06)')}
      >
        {!t.video_url && t.message !== '[Témoignage vidéo]' && (
          <div
            className="font-display text-6xl leading-none mb-3 select-none"
            style={{ color: 'rgba(200,16,46,0.18)' }}
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
            style={{ backgroundColor: 'rgba(27,43,94,0.08)', color: '#1B2B5E' }}
          >
            🎥 Témoignage vidéo
          </span>
        ) : (
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(27,43,94,0.75)' }}>
            {t.message}
          </p>
        )}

        {t.rating && (
          <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="text-sm"
                style={{ color: i < t.rating ? '#C8102E' : 'rgba(27,43,94,0.15)' }}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <div
          className="flex items-center gap-3 pt-4"
          style={{ borderTop: '1px solid rgba(27,43,94,0.08)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none"
            style={{ backgroundColor: '#1B2B5E' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: '#1B2B5E' }}>
              {t.name}
            </div>
            {(t.role || t.company) && (
              <div className="text-xs truncate" style={{ color: 'rgba(27,43,94,0.4)' }}>
                {[t.role, t.company].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

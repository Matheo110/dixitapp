import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useLanguage } from '../context/LanguageContext'

const FONT_FAMILY = {
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'Inter': "'Inter', sans-serif",
  'Georgia': 'Georgia, serif',
  'Arial': 'Arial, sans-serif',
}

const inputStyle = {
  backgroundColor: '#F5F0E8',
  border: '1.5px solid rgba(27,43,94,0.2)',
  color: '#1B2B5E',
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
}
const onFocus = e => (e.target.style.borderColor = 'rgba(27,43,94,0.5)')
const onBlur  = e => (e.target.style.borderColor = 'rgba(27,43,94,0.2)')

export default function CustomizeCollect() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [collectTitle, setCollectTitle] = useState('')
  const [collectSubtitle, setCollectSubtitle] = useState('')
  const [collectBgColor, setCollectBgColor] = useState('#F5F0E8')
  const [collectPrimaryColor, setCollectPrimaryColor] = useState('#1B2B5E')
  const [collectAccentColor, setCollectAccentColor] = useState('#C8102E')
  const [collectFont, setCollectFont] = useState('Playfair Display')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login', { replace: true }); return }
      setUser(user)
      supabase
        .from('profiles')
        .select('collect_title, collect_subtitle, collect_bg_color, collect_primary_color, collect_accent_color, collect_font')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setCollectTitle(data?.collect_title || '')
          setCollectSubtitle(data?.collect_subtitle || '')
          setCollectBgColor(data?.collect_bg_color || '#F5F0E8')
          setCollectPrimaryColor(data?.collect_primary_color || '#1B2B5E')
          setCollectAccentColor(data?.collect_accent_color || '#C8102E')
          setCollectFont(data?.collect_font || 'Playfair Display')
          setLoading(false)
        })
    })
  }, [navigate])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const { error } = await supabase
      .from('profiles')
      .update({
        collect_title: collectTitle.trim() || null,
        collect_subtitle: collectSubtitle.trim() || null,
        collect_bg_color: collectBgColor,
        collect_primary_color: collectPrimaryColor,
        collect_accent_color: collectAccentColor,
        collect_font: collectFont,
      })
      .eq('id', user.id)
    if (error) setError(error.message)
    else setSaved(true)
    setSaving(false)
  }

  const navRight = (
    <button
      onClick={() => navigate('/dashboard')}
      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}
      onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
    >
      {t.profile.backToDashboard}
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <Navbar right={navRight} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: 'rgba(27,43,94,0.45)' }}>{t.profile.loading}</p>
        </div>
      </div>
    )
  }

  const colorLabels = [
    { label: t.profile.colorBg,      value: collectBgColor,      set: setCollectBgColor },
    { label: t.profile.colorPrimary, value: collectPrimaryColor, set: setCollectPrimaryColor },
    { label: t.profile.colorAccent,  value: collectAccentColor,  set: setCollectAccentColor },
  ]

  const previewTitle = collectTitle || t.collect.shareExperience
  const previewSub   = collectSubtitle || t.collect.defaultMessage

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="font-display font-bold text-3xl mb-8" style={{ color: '#1B2B5E' }}>
          {t.profile.collectSection}
        </h1>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
          <div style={{ height: 4, backgroundColor: '#C8102E' }} />

          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.collectPageTitle}
              </label>
              <input
                type="text"
                value={collectTitle}
                onChange={e => setCollectTitle(e.target.value)}
                placeholder={t.profile.collectPageTitlePlaceholder}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.collectSubtitleLabel}
              </label>
              <input
                type="text"
                value={collectSubtitle}
                onChange={e => setCollectSubtitle(e.target.value)}
                placeholder={t.profile.collectSubtitlePlaceholder}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#1B2B5E' }}>
                {t.profile.colors}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {colorLabels.map(({ label, value, set }) => (
                  <div key={label}>
                    <p className="text-xs mb-2" style={{ color: 'rgba(27,43,94,0.5)' }}>{label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: value, border: '2px solid rgba(27,43,94,0.15)', cursor: 'pointer' }} />
                        <input
                          type="color"
                          value={value}
                          onChange={e => set(e.target.value)}
                          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
                        />
                      </label>
                      <code style={{ fontSize: '0.78rem', color: 'rgba(27,43,94,0.55)', backgroundColor: '#F5F0E8', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                        {value}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>{t.profile.font}</label>
              <select
                value={collectFont}
                onChange={e => setCollectFont(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {Object.keys(FONT_FAMILY).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Live preview */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(27,43,94,0.1)' }}>
              <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f4f4f4', borderBottom: '1px solid rgba(27,43,94,0.07)' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(27,43,94,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.profile.preview}</span>
              </div>
              <div style={{ backgroundColor: collectBgColor, padding: '1.5rem' }}>
                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: FONT_FAMILY[collectFont], fontWeight: 700, fontSize: '1.25rem', color: collectPrimaryColor, marginBottom: '0.35rem', lineHeight: 1.25 }}>
                    {previewTitle}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: `${collectPrimaryColor}80`, marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {previewSub}
                  </p>
                  <div style={{ width: 30, height: 3, backgroundColor: collectAccentColor, borderRadius: '999px', margin: '0 auto' }} />
                </div>

                {/* Mini form card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ height: 3, backgroundColor: collectAccentColor }} />
                  <div style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.6rem' }}>
                      <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: collectPrimaryColor, color: '#ffffff', fontSize: '0.7rem', textAlign: 'center', fontWeight: 500 }}>
                        ✍️ {lang === 'en' ? 'Written' : 'Écrit'}
                      </div>
                      <div style={{ padding: '0.5rem', borderRadius: '8px', border: `1.5px solid ${collectPrimaryColor}`, color: collectPrimaryColor, fontSize: '0.7rem', textAlign: 'center', fontWeight: 500 }}>
                        🎥 {lang === 'en' ? 'Video' : 'Vidéo'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: collectBgColor, border: `1.5px solid ${collectPrimaryColor}25`, borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.7rem', color: `${collectPrimaryColor}55`, marginBottom: '0.5rem' }}>
                      {lang === 'en' ? 'Your first name…' : 'Votre prénom…'}
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                      {[1,2,3,4,5].map(i => <span key={i} style={{ color: collectAccentColor, fontSize: '0.9rem' }}>★</span>)}
                    </div>
                    <div style={{ backgroundColor: collectAccentColor, borderRadius: '8px', padding: '0.4rem', fontSize: '0.7rem', color: '#ffffff', textAlign: 'center', fontWeight: 600 }}>
                      {lang === 'en' ? 'Submit my testimonial' : 'Envoyer mon témoignage'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm rounded-xl px-4 py-3" style={{ color: '#C8102E', backgroundColor: 'rgba(200,16,46,0.07)', border: '1px solid rgba(200,16,46,0.2)' }}>
                {error}
              </div>
            )}

            {saved && (
              <div className="text-sm rounded-xl px-4 py-3" style={{ color: '#1B2B5E', backgroundColor: 'rgba(27,43,94,0.07)', border: '1px solid rgba(27,43,94,0.15)' }}>
                {t.profile.saved}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1B2B5E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => !saving && (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {saving ? t.profile.saving : t.profile.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCollectBgColor('#F5F0E8')
                  setCollectPrimaryColor('#1B2B5E')
                  setCollectAccentColor('#C8102E')
                  setCollectFont('Playfair Display')
                  setCollectTitle('')
                  setCollectSubtitle('')
                }}
                style={{ background: 'transparent', border: '1px solid #888', color: '#888', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#555' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#888'; e.currentTarget.style.color = '#888' }}
              >
                {t.profile.reset}
              </button>
            </div>

          </form>
        </div>
      </main>

      <footer style={{ backgroundColor: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
      </footer>
    </div>
  )
}

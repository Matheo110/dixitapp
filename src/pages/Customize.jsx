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

export default function Customize() {
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [wallTitle, setWallTitle] = useState('')
  const [wallBgColor, setWallBgColor] = useState('#F5F0E8')
  const [wallPrimaryColor, setWallPrimaryColor] = useState('#1B2B5E')
  const [wallAccentColor, setWallAccentColor] = useState('#C8102E')
  const [wallFont, setWallFont] = useState('Playfair Display')
  const [wallLayout, setWallLayout] = useState('grid')

  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login', { replace: true }); return }
      setUser(user)

      supabase
        .from('profiles')
        .select('wall_title, wall_bg_color, wall_primary_color, wall_accent_color, wall_font, wall_layout')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setWallTitle(data?.wall_title || '')
          setWallBgColor(data?.wall_bg_color || '#F5F0E8')
          setWallPrimaryColor(data?.wall_primary_color || '#1B2B5E')
          setWallAccentColor(data?.wall_accent_color || '#C8102E')
          setWallFont(data?.wall_font || 'Playfair Display')
          setWallLayout(data?.wall_layout || 'grid')
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
        wall_title: wallTitle.trim() || null,
        wall_bg_color: wallBgColor,
        wall_primary_color: wallPrimaryColor,
        wall_accent_color: wallAccentColor,
        wall_font: wallFont,
        wall_layout: wallLayout,
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
    { label: t.profile.colorBg, value: wallBgColor, set: setWallBgColor },
    { label: t.profile.colorPrimary, value: wallPrimaryColor, set: setWallPrimaryColor },
    { label: t.profile.colorAccent, value: wallAccentColor, set: setWallAccentColor },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="font-display font-bold text-3xl mb-8" style={{ color: '#1B2B5E' }}>
          {t.profile.wallSection}
        </h1>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
          <div style={{ height: 4, backgroundColor: '#1B2B5E' }} />

          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.wallTitle}
              </label>
              <input
                type="text"
                value={wallTitle}
                onChange={e => setWallTitle(e.target.value)}
                placeholder={t.profile.wallTitlePlaceholder}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>{t.profile.font}</label>
                <select
                  value={wallFont}
                  onChange={e => setWallFont(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {Object.keys(FONT_FAMILY).map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>{t.profile.layout}</label>
                <select
                  value={wallLayout}
                  onChange={e => setWallLayout(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="grid">{t.profile.layoutGrid}</option>
                  <option value="list">{t.profile.layoutList}</option>
                </select>
              </div>
            </div>

            {/* Live preview */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(27,43,94,0.1)' }}>
              <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f4f4f4', borderBottom: '1px solid rgba(27,43,94,0.07)' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(27,43,94,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.profile.preview}</span>
              </div>
              <div style={{ backgroundColor: wallBgColor, padding: '1.5rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: wallAccentColor, marginBottom: '0.5rem' }}>
                  {t.profile.previewReview}
                </p>
                <h3 style={{ fontFamily: FONT_FAMILY[wallFont], fontWeight: 700, color: wallPrimaryColor, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                  {wallTitle || t.wall.defaultTitle}
                </h3>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1rem', border: `1px solid ${wallPrimaryColor}18`, boxShadow: `0 1px 4px ${wallPrimaryColor}0f` }}>
                  <div style={{ fontFamily: FONT_FAMILY[wallFont], fontSize: '2.5rem', lineHeight: 1, color: `${wallAccentColor}40`, marginBottom: '0.4rem' }}>"</div>
                  <p style={{ fontSize: '0.8rem', color: `${wallPrimaryColor}b3`, lineHeight: 1.55, marginBottom: '0.75rem' }}>
                    {t.profile.previewQuote}
                  </p>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem' }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ color: wallAccentColor, fontSize: '0.85rem' }}>★</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: `1px solid ${wallPrimaryColor}12`, paddingTop: '0.75rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: wallPrimaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>AB</div>
                    <span style={{ color: wallPrimaryColor, fontSize: '0.8rem', fontWeight: 600 }}>Alice B.</span>
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
                  setWallBgColor('#F5F0E8')
                  setWallPrimaryColor('#1B2B5E')
                  setWallAccentColor('#C8102E')
                  setWallFont('Playfair Display')
                  setWallTitle('')
                  setWallLayout('grid')
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

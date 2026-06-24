import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

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

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [firstname, setFirstname] = useState('')
  const [company, setCompany] = useState('')
  const [activity, setActivity] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Wall customization
  const [wallTitle, setWallTitle] = useState('Témoignages de nos clients')
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
        .select('firstname, company, activity, custom_message, avatar_url, wall_title, wall_bg_color, wall_primary_color, wall_accent_color, wall_font, wall_layout')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setFirstname(data?.firstname || user.user_metadata?.first_name || '')
          setCompany(data?.company || '')
          setActivity(data?.activity || '')
          setCustomMessage(data?.custom_message || '')
          setAvatarUrl(data?.avatar_url || '')
          setWallTitle(data?.wall_title || 'Témoignages de nos clients')
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
        firstname: firstname.trim() || null,
        company: company.trim() || null,
        activity: activity.trim() || null,
        custom_message: customMessage.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        wall_title: wallTitle.trim() || 'Témoignages de nos clients',
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
      ← Retour au dashboard
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <Navbar right={navRight} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: 'rgba(27,43,94,0.45)' }}>Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1
          className="font-display font-bold text-3xl mb-8"
          style={{ color: '#1B2B5E' }}
        >
          Mon profil
        </h1>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
          <div style={{ height: 4, backgroundColor: '#1B2B5E' }} />

          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                Prénom
              </label>
              <input
                type="text"
                value={firstname}
                onChange={e => setFirstname(e.target.value)}
                placeholder="Votre prénom"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                Nom de mon entreprise
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Ex : Studio Créatif Paris"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                Mon métier / activité
              </label>
              <input
                type="text"
                value={activity}
                onChange={e => setActivity(e.target.value)}
                placeholder="Ex : Développeur web freelance"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                Message personnalisé
                <span className="ml-1 font-normal text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>
                  — affiché sur la page de collecte
                </span>
              </label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={3}
                placeholder="Ex : Merci de prendre 2 minutes pour partager votre expérience !"
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                Photo de profil
                <span className="ml-1 font-normal text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>
                  — URL optionnelle
                </span>
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://exemple.com/photo.jpg"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              {avatarUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt="Aperçu"
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(27,43,94,0.15)' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>Aperçu de votre photo</span>
                </div>
              )}
            </div>

            {/* ── WALL CUSTOMIZATION ── */}
            <div style={{ borderTop: '1px solid rgba(27,43,94,0.1)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <h2 className="font-display font-semibold text-lg mb-5" style={{ color: '#1B2B5E' }}>
                Personnaliser mon mur public
              </h2>

              <div className="space-y-5">

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                    Titre du mur
                  </label>
                  <input
                    type="text"
                    value={wallTitle}
                    onChange={e => setWallTitle(e.target.value)}
                    placeholder="Ex : Ce que disent mes clients"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#1B2B5E' }}>
                    Couleurs
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Fond', value: wallBgColor, set: setWallBgColor },
                      { label: 'Principale', value: wallPrimaryColor, set: setWallPrimaryColor },
                      { label: 'Accent', value: wallAccentColor, set: setWallAccentColor },
                    ].map(({ label, value, set }) => (
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>Police</label>
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>Disposition</label>
                    <select
                      value={wallLayout}
                      onChange={e => setWallLayout(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="grid">Grille</option>
                      <option value="list">Liste</option>
                    </select>
                  </div>
                </div>

                {/* Live preview */}
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(27,43,94,0.1)' }}>
                  <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f4f4f4', borderBottom: '1px solid rgba(27,43,94,0.07)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(27,43,94,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aperçu</span>
                  </div>
                  <div style={{ backgroundColor: wallBgColor, padding: '1.5rem' }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: wallAccentColor, marginBottom: '0.5rem' }}>
                      Avis clients
                    </p>
                    <h3 style={{ fontFamily: FONT_FAMILY[wallFont], fontWeight: 700, color: wallPrimaryColor, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                      {wallTitle || 'Témoignages de nos clients'}
                    </h3>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '1rem', border: `1px solid ${wallPrimaryColor}18`, boxShadow: `0 1px 4px ${wallPrimaryColor}0f` }}>
                      <div style={{ fontFamily: FONT_FAMILY[wallFont], fontSize: '2.5rem', lineHeight: 1, color: `${wallAccentColor}40`, marginBottom: '0.4rem' }}>"</div>
                      <p style={{ fontSize: '0.8rem', color: `${wallPrimaryColor}b3`, lineHeight: 1.55, marginBottom: '0.75rem' }}>
                        Super prestation, très satisfait ! Je recommande vivement.
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

              </div>
            </div>

            {error && (
              <div
                className="text-sm rounded-xl px-4 py-3"
                style={{ color: '#C8102E', backgroundColor: 'rgba(200,16,46,0.07)', border: '1px solid rgba(200,16,46,0.2)' }}
              >
                {error}
              </div>
            )}

            {saved && (
              <div
                className="text-sm rounded-xl px-4 py-3"
                style={{ color: '#1B2B5E', backgroundColor: 'rgba(27,43,94,0.07)', border: '1px solid rgba(27,43,94,0.15)' }}
              >
                Profil enregistré avec succès.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1B2B5E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => !saving && (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>

          </form>
        </div>
      </main>

      <footer style={{ backgroundColor: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
      </footer>
    </div>
  )
}

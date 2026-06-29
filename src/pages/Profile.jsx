import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useLanguage } from '../context/LanguageContext'

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

const SECTORS = [
  { value: 'Développement web',      en: 'Web development' },
  { value: 'Design graphique',       en: 'Graphic design' },
  { value: 'Marketing digital',      en: 'Digital marketing' },
  { value: 'Conseil & Stratégie',    en: 'Consulting & Strategy' },
  { value: 'Communication',          en: 'Communication' },
  { value: 'Photographie',           en: 'Photography' },
  { value: 'Rédaction & Copywriting',en: 'Writing & Copywriting' },
  { value: 'Formation & Coaching',   en: 'Training & Coaching' },
  { value: 'E-commerce',             en: 'E-commerce' },
  { value: 'Autre',                  en: 'Other' },
]

export default function Profile() {
  const { t, lang } = useLanguage()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [firstname, setFirstname] = useState('')
  const [company, setCompany] = useState('')
  const [activity, setActivity] = useState('')
  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login', { replace: true }); return }
      setUser(user)

      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setFirstname(data?.firstname || user.user_metadata?.first_name || '')
          setCompany(data?.company || '')
          setActivity(data?.activity || '')
          setSector(data?.sector || '')
          setCity(data?.city || '')
          setAvatarUrl(data?.avatar_url || '')
          setLoading(false)
        })
    })
  }, [navigate])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t.profile.avatarSizeError)
      return
    }
    setUploadingAvatar(true)
    setUploadError(null)
    const path = `${user.id}/avatar`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      setUploadError(upErr.message)
      setUploadingAvatar(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setUploadingAvatar(false)
  }

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
        sector: sector || null,
        city: city.trim() || null,
        avatar_url: avatarUrl || null,
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1
          className="font-display font-bold text-3xl mb-8"
          style={{ color: '#1B2B5E' }}
        >
          {t.profile.title}
        </h1>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(27,43,94,0.1)' }}>
          <div style={{ height: 4, backgroundColor: '#1B2B5E' }} />

          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">

            {/* Avatar upload */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#1B2B5E' }}>
                {t.profile.avatarUrl}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #1B2B5E', overflow: 'hidden', flexShrink: 0, backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={t.profile.avatarPreview}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(27,43,94,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    id="avatar-upload"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <label
                    htmlFor="avatar-upload"
                    style={{ display: 'inline-block', backgroundColor: uploadingAvatar ? 'rgba(27,43,94,0.4)' : '#1B2B5E', color: '#F5F0E8', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}
                  >
                    {uploadingAvatar ? t.profile.avatarUploading : t.profile.avatarChoose}
                  </label>
                  <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'rgba(27,43,94,0.4)' }}>
                    JPG, PNG, WebP — max 5 MB
                  </p>
                  {uploadError && (
                    <p style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#C8102E' }}>{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.firstname}
              </label>
              <input
                type="text"
                value={firstname}
                onChange={e => setFirstname(e.target.value)}
                placeholder={t.profile.firstnamePlaceholder}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.company}
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder={t.profile.companyPlaceholder}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.activity}
              </label>
              <input
                type="text"
                value={activity}
                onChange={e => setActivity(e.target.value)}
                placeholder={t.profile.activityPlaceholder}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.sector}
              </label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                <option value="">{t.profile.sectorPlaceholder}</option>
                {SECTORS.map(s => (
                  <option key={s.value} value={s.value}>
                    {lang === 'en' ? s.en : s.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                {t.profile.city}
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder={t.profile.cityPlaceholder}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
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
                {t.profile.saved}
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
              {saving ? t.profile.saving : t.profile.save}
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

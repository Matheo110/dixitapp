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

export default function Profile() {
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [firstname, setFirstname] = useState('')
  const [company, setCompany] = useState('')
  const [activity, setActivity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

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
          setAvatarUrl(data?.avatar_url || '')
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
        avatar_url: avatarUrl.trim() || null,
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
                {t.profile.avatarUrl}
                <span className="ml-1 font-normal text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>
                  {t.profile.avatarUrlNote}
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
                    alt={t.profile.avatarPreview}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(27,43,94,0.15)' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>{t.profile.avatarPreview}</span>
                </div>
              )}
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

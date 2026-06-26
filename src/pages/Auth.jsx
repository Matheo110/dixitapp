import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/slug'
import Navbar from '../components/Navbar'

const inputStyle = {
  backgroundColor: '#F5F0E8',
  border: '1.5px solid rgba(27,43,94,0.2)',
  color: '#1B2B5E',
}
const onFocus = e => (e.target.style.borderColor = 'rgba(27,43,94,0.5)')
const onBlur  = e => (e.target.style.borderColor = 'rgba(27,43,94,0.2)')

const EyeOn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

function validatePassword(pw) {
  const errors = []
  if (pw.length < 8) errors.push('8 caractères minimum')
  if (!/[0-9]/.test(pw)) errors.push('Au moins 1 chiffre')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) errors.push('Au moins 1 caractère spécial')
  if (!/[A-Z]/.test(pw)) errors.push('Au moins 1 majuscule')
  return errors
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login')

  // Login / signup state
  const [firstName, setFirstName] = useState('')
  const [signupCompany, setSignupCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    setMessage(null)
    setResetError('')
    setResetSent(false)
    setResetEmail('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else navigate('/dashboard', { replace: true })

    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName.trim() } },
      })
      if (error) { setError(error.message); setLoading(false) }
      else {
        if (data?.user) {
          const nameForSlug = firstName.trim() || email.split('@')[0]
          await supabase.from('profiles').upsert({
            id: data.user.id,
            firstname: firstName.trim() || null,
            company: signupCompany.trim() || null,
            slug: generateSlug(nameForSlug),
          })
        }
        setMessage('Vérifiez votre email pour confirmer votre compte, puis connectez-vous.')
        setLoading(false)
      }
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setResetError('')
    console.log('[handleReset] sending to:', resetEmail)
    const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    console.log('[handleReset] response — data:', data, 'error:', error)
    if (error) setResetError(error.message || error.toString() || 'Erreur lors de l\'envoi. Veuillez réessayer.')
    else setResetSent(true)
  }

  const passwordErrors = mode === 'signup' ? validatePassword(password) : []
  const passwordStrength = 4 - passwordErrors.length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div style={{ height: 4, backgroundColor: '#C8102E' }} />

            <div className="px-8 pt-8 pb-10">

              {/* Branding */}
              <div className="text-center mb-8">
                <h1
                  className="font-display font-bold tracking-widest uppercase"
                  style={{ color: '#1B2B5E', fontSize: '1.5rem' }}
                >
                  DIXITAPP
                </h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(27,43,94,0.45)' }}>
                  Collectez des témoignages clients
                </p>
              </div>

              {/* ── FORGOT PASSWORD ── */}
              {mode === 'reset' && (
                <div style={{padding: '2rem', maxWidth: '420px', margin: '0 auto'}}>
                  <h2 style={{fontFamily: 'Playfair Display', color: '#1B2B5E', marginBottom: '0.5rem'}}>Mot de passe oublié ?</h2>
                  <p style={{color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem'}}>Entrez votre email pour recevoir un lien de réinitialisation.</p>
                  {resetSent ? (
                    <p style={{color: '#1B2B5E', padding: '1rem', background: '#F0F4FF', borderRadius: '6px'}}>Email envoyé ! Vérifiez votre boîte mail.</p>
                  ) : (
                    <form onSubmit={handleReset}>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        style={{width: '100%', padding: '0.75rem', border: '1.5px solid #E0D8CC', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem'}}
                      />
                      {resetError !== '' && resetError && <p style={{color: '#C8102E', fontSize: '0.8rem', marginBottom: '0.5rem'}}>{resetError}</p>}
                      <button type="submit" style={{width: '100%', background: '#1B2B5E', color: '#F5F0E8', padding: '0.85rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem'}}>Envoyer le lien</button>
                    </form>
                  )}
                  <p style={{textAlign: 'center', marginTop: '1rem'}}><button onClick={() => setMode('login')} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem'}}>Retour à la connexion</button></p>
                </div>
              )}

              {/* ── LOGIN / SIGNUP ── */}
              {mode !== 'reset' && (
                <>
                  <div className="flex rounded-xl p-1 mb-7" style={{ backgroundColor: '#F5F0E8' }}>
                    {[['login', 'Connexion'], ['signup', 'Créer un compte']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => switchMode(val)}
                        className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                        style={
                          mode === val
                            ? { backgroundColor: '#1B2B5E', color: '#ffffff' }
                            : { color: 'rgba(27,43,94,0.5)' }
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'signup' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                            Prénom
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            placeholder="Prénom"
                            autoComplete="given-name"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={inputStyle}
                            onFocus={onFocus}
                            onBlur={onBlur}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                            Nom de votre entreprise{' '}
                            <span className="font-normal text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>(optionnel)</span>
                          </label>
                          <input
                            type="text"
                            value={signupCompany}
                            onChange={e => setSignupCompany(e.target.value)}
                            placeholder="Mon Entreprise"
                            autoComplete="organization"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={inputStyle}
                            onFocus={onFocus}
                            onBlur={onBlur}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="votre@email.com"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                        Mot de passe
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          minLength={6}
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          placeholder="Mot de passe"
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={{ ...inputStyle, paddingRight: '2.75rem' }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          {showPassword ? <EyeOff /> : <EyeOn />}
                        </button>
                      </div>
                      {mode === 'signup' ? (
                        <div className="mt-2">
                          {password.length > 0 && (
                            <>
                              <div className="flex gap-1 mb-1.5">
                                {[0, 1, 2, 3].map(i => (
                                  <div
                                    key={i}
                                    className="flex-1 rounded-full"
                                    style={{
                                      height: '3px',
                                      backgroundColor: i < passwordStrength
                                        ? passwordStrength <= 1 ? '#C8102E' : passwordStrength <= 3 ? '#F59E0B' : '#22C55E'
                                        : 'rgba(27,43,94,0.12)',
                                    }}
                                  />
                                ))}
                              </div>
                              {passwordErrors.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {passwordErrors.map(e => (
                                    <li key={e} className="text-xs" style={{ color: 'rgba(27,43,94,0.5)', marginBottom: '2px' }}>· {e}</li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                          {password.length === 0 && (
                            <p className="text-xs" style={{ color: 'rgba(27,43,94,0.35)' }}>
                              8 caractères minimum, avec chiffre, majuscule et caractère spécial
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-right mt-1.5">
                          <button
                            type="button"
                            onClick={() => switchMode('reset')}
                            className="text-xs transition-all"
                            style={{ color: '#888888', textDecoration: 'none' }}
                            onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.target.style.textDecoration = 'none')}
                          >
                            Mot de passe oublié ?
                          </button>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div
                        className="text-sm rounded-xl px-4 py-3"
                        style={{
                          color: '#C8102E',
                          backgroundColor: 'rgba(200,16,46,0.07)',
                          border: '1px solid rgba(200,16,46,0.2)',
                        }}
                      >
                        {error}
                      </div>
                    )}
                    {message && (
                      <div
                        className="text-sm rounded-xl px-4 py-3"
                        style={{
                          color: '#1B2B5E',
                          backgroundColor: 'rgba(27,43,94,0.07)',
                          border: '1px solid rgba(27,43,94,0.2)',
                        }}
                      >
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || (mode === 'signup' && passwordErrors.length > 0)}
                      className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#C8102E' }}
                      onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#a80d26')}
                      onMouseLeave={e => (e.target.style.backgroundColor = '#C8102E')}
                    >
                      {loading
                        ? 'Veuillez patienter…'
                        : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(27,43,94,0.4)' }}>
            © 2025 dixitapp.tech — Fait en France 🇫🇷
            <span style={{ margin: '0 0.4rem' }}>·</span>
            <a href="/cgv" style={{ color: 'rgba(27,43,94,0.4)', textDecoration: 'none' }}>CGV</a>
            <span style={{ margin: '0 0.3rem' }}>|</span>
            <a href="/mentions" style={{ color: 'rgba(27,43,94,0.4)', textDecoration: 'none' }}>Mentions légales</a>
            <span style={{ margin: '0 0.3rem' }}>|</span>
            <a href="/privacy" style={{ color: 'rgba(27,43,94,0.4)', textDecoration: 'none' }}>Confidentialité</a>
          </p>
        </div>
      </div>
    </div>
  )
}

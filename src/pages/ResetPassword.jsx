import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

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

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is ready to reset password
      }
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else {
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    }
  }

  const passwordErrors = validatePassword(password)
  const passwordStrength = 4 - passwordErrors.length

  return (
    <div style={{background: '#F5F0E8', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>

      {/* Navbar */}
      <nav style={{background: '#1B2B5E', padding: '1.25rem 2.5rem', width: '100%'}}>
        <span style={{fontFamily: 'Playfair Display, serif', fontWeight: 'bold', color: '#F5F0E8', fontSize: '1.2rem', letterSpacing: '0.15em', textTransform: 'uppercase'}}>
          DIXITAPP
        </span>
      </nav>

      {/* Centered card */}
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem'}}>
        <div style={{background: 'white', borderTop: '4px solid #C8102E', border: '1.5px solid #1B2B5E', borderRadius: '8px', padding: '2.5rem', width: '100%', maxWidth: '420px'}}>
          <h2 style={{fontFamily: 'Playfair Display', color: '#1B2B5E', marginBottom: '0.5rem'}}>Nouveau mot de passe</h2>
          <p style={{color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem'}}>Choisissez un nouveau mot de passe sécurisé.</p>
          {success ? (
            <p style={{color: '#1B2B5E', padding: '1rem', background: '#F0F4FF', borderRadius: '6px'}}>Mot de passe mis à jour ! Redirection...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{position: 'relative', marginBottom: '0.5rem'}}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" required style={{width: '100%', padding: '0.75rem', paddingRight: '2.75rem', border: '1.5px solid #E0D8CC', borderRadius: '6px', fontSize: '0.9rem'}} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0, display: 'flex', alignItems: 'center'}}>
                  {showPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{marginBottom: '1rem'}}>
                  <div style={{display: 'flex', gap: '4px', marginBottom: '6px'}}>
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '3px',
                          borderRadius: '9999px',
                          backgroundColor: i < passwordStrength
                            ? passwordStrength <= 1 ? '#C8102E' : passwordStrength <= 3 ? '#F59E0B' : '#22C55E'
                            : 'rgba(27,43,94,0.12)',
                        }}
                      />
                    ))}
                  </div>
                  {passwordErrors.length > 0 && (
                    <ul style={{margin: 0, padding: 0, listStyle: 'none'}}>
                      {passwordErrors.map(e => (
                        <li key={e} style={{fontSize: '0.75rem', color: 'rgba(27,43,94,0.5)', marginBottom: '2px'}}>· {e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {password.length === 0 && <div style={{marginBottom: '0.5rem'}} />}
              <div style={{position: 'relative', marginBottom: '1rem'}}>
                <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" required style={{width: '100%', padding: '0.75rem', paddingRight: '2.75rem', border: '1.5px solid #E0D8CC', borderRadius: '6px', fontSize: '0.9rem'}} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0, display: 'flex', alignItems: 'center'}}>
                  {showConfirm ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {error && <p style={{color: '#C8102E', fontSize: '0.8rem', marginBottom: '0.5rem'}}>{error}</p>}
              <button type="submit" disabled={passwordErrors.length > 0} style={{width: '100%', background: '#1B2B5E', color: '#F5F0E8', padding: '0.85rem', borderRadius: '6px', border: 'none', cursor: passwordErrors.length > 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: passwordErrors.length > 0 ? 0.5 : 1}}>Mettre à jour</button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{background: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center'}}>
        <span style={{color: '#666', fontSize: '0.8rem'}}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
      </footer>

    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '2rem' }}>
    <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: '#1B2B5E', marginBottom: '0.75rem' }}>
      {title}
    </h2>
    <div style={{ color: 'rgba(27,43,94,0.75)', fontSize: '0.9rem', lineHeight: 1.75 }}>
      {children}
    </div>
  </div>
)

export default function Mentions() {
  const navigate = useNavigate()

  const navRight = (
    <button
      onClick={() => navigate(-1)}
      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
    >
      ← Retour
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar right={navRight} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="font-display font-bold text-3xl mb-2" style={{ color: '#1B2B5E' }}>
          Mentions légales
        </h1>
        <p style={{ color: 'rgba(27,43,94,0.45)', fontSize: '0.8rem', marginBottom: '2.5rem' }}>
          Dernière mise à jour : juin 2025
        </p>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(27,43,94,0.08)' }}>

          <Section title="Éditeur du site">
            <p>
              <strong>Matheo Louro</strong><br />
              Auto-entrepreneur<br />
              Site web : dixitapp.tech<br />
              Email : hello@dixitapp.tech
            </p>
          </Section>

          <Section title="Directeur de la publication">
            <p>Matheo Louro</p>
          </Section>

          <Section title="Hébergement">
            <p>
              <strong>Frontend :</strong> Netlify, Inc.<br />
              44 Montgomery Street, Suite 300, San Francisco, CA 94104, USA<br />
              <a href="https://www.netlify.com" style={{ color: '#C8102E' }}>www.netlify.com</a>
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              <strong>Backend & base de données :</strong> Supabase Inc.<br />
              970 Toa Payoh North, #07-04, Singapore 318992<br />
              <a href="https://supabase.com" style={{ color: '#C8102E' }}>supabase.com</a>
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L'ensemble du contenu de ce site (design, textes, code, logo) est la propriété exclusive de Matheo Louro, sauf mention contraire.
              Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative au site :<br />
              <a href="mailto:hello@dixitapp.tech" style={{ color: '#C8102E' }}>hello@dixitapp.tech</a>
            </p>
          </Section>

        </div>
      </main>

      <footer style={{ backgroundColor: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.5rem' }}>·</span>
        <a href="/cgv" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>CGV</a>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/mentions" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>Mentions légales</a>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/privacy" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>Confidentialité</a>
      </footer>
    </div>
  )
}

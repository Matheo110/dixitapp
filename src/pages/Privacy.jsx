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

export default function Privacy() {
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
          Politique de confidentialité
        </h1>
        <p style={{ color: 'rgba(27,43,94,0.45)', fontSize: '0.8rem', marginBottom: '2.5rem' }}>
          Dernière mise à jour : juin 2025
        </p>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(27,43,94,0.08)' }}>

          <Section title="1. Responsable du traitement">
            <p>
              Matheo Louro — Dixitapp<br />
              Email : hello@dixitapp.tech
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>Lors de l'utilisation de Dixitapp, nous collectons les données suivantes :</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
              <li><strong>Compte utilisateur :</strong> adresse email, prénom, nom d'entreprise</li>
              <li><strong>Témoignages clients :</strong> prénom, message, note, vidéo (si applicable), entreprise et rôle (optionnels)</li>
              <li><strong>Données de paiement :</strong> gérées exclusivement par Stripe — Dixitapp ne stocke aucune donnée bancaire</li>
              <li><strong>Données techniques :</strong> logs de connexion, adresse IP (gérés par Supabase et Netlify)</li>
            </ul>
          </Section>

          <Section title="3. Finalité du traitement">
            <p>Les données sont utilisées pour :</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
              <li>Fournir et améliorer le service Dixitapp</li>
              <li>Gérer les comptes utilisateurs et les abonnements</li>
              <li>Envoyer des emails de notification liés au service</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              Dixitapp ne vend, ne loue et ne partage aucune donnée personnelle avec des tiers à des fins commerciales.
            </p>
          </Section>

          <Section title="4. Hébergement des données">
            <p>
              Les données sont hébergées sur l'infrastructure <strong>Supabase</strong> (région <strong>eu-west-1</strong> — Europe),
              conformément au RGPD. Les fichiers vidéo sont stockés dans le même environnement sécurisé.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>
              Dixitapp utilise uniquement des cookies fonctionnels nécessaires à l'authentification et au maintien de session.
              Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </Section>

          <Section title="6. Durée de conservation">
            <p>
              Les données sont conservées pendant toute la durée d'activité du compte utilisateur.
              En cas de suppression du compte, les données personnelles sont supprimées dans un délai de 30 jours.
            </p>
          </Section>

          <Section title="7. Vos droits">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger vos données</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte et de vos données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              Pour exercer ces droits : <a href="mailto:hello@dixitapp.tech" style={{ color: '#C8102E' }}>hello@dixitapp.tech</a>
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Pour toute question relative à la protection de vos données personnelles :<br />
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

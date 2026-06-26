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

export default function CGV() {
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
          Conditions Générales de Vente
        </h1>
        <p style={{ color: 'rgba(27,43,94,0.45)', fontSize: '0.8rem', marginBottom: '2.5rem' }}>
          Dernière mise à jour : juin 2025
        </p>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(27,43,94,0.08)' }}>

          <Section title="1. Prestataire">
            <p>Les présentes CGV régissent les relations commerciales entre :</p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Dixitapp</strong> — Auto-entrepreneur<br />
              Fondateur : Matheo Louro<br />
              Site web : dixitapp.tech<br />
              Email : hello@dixitapp.tech
            </p>
            <p style={{ marginTop: '0.5rem' }}>Et tout utilisateur souscrivant à un plan payant sur dixitapp.tech.</p>
          </Section>

          <Section title="2. Plans et tarifs">
            <p>Dixitapp propose les offres suivantes :</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
              <li><strong>Free</strong> — 0 €/mois (5 témoignages, branding Dixitapp)</li>
              <li><strong>Pro</strong> — 29 €/mois (témoignages illimités, vidéo, sans branding)</li>
              <li><strong>Agency</strong> — 79 €/mois (multi-comptes, white label, accès API)</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>Les prix sont indiqués en euros TTC. Dixitapp se réserve le droit de modifier ses tarifs à tout moment, avec notification préalable de 30 jours.</p>
          </Section>

          <Section title="3. Paiement">
            <p>
              Le paiement est effectué en ligne via <strong>Stripe</strong>, plateforme de paiement sécurisée.
              Dixitapp ne stocke aucune donnée bancaire. L'abonnement est facturé mensuellement à date anniversaire.
            </p>
          </Section>

          <Section title="4. Résiliation">
            <p>
              L'utilisateur peut résilier son abonnement à tout moment depuis son espace client ou en contactant hello@dixitapp.tech.
              La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement proratisé n'est effectué pour les jours restants.
            </p>
          </Section>

          <Section title="5. Droit de rétractation">
            <p>
              Conformément à l'article L221-18 du Code de la consommation, l'utilisateur bénéficie d'un délai de <strong>14 jours</strong> à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motifs.
              Pour exercer ce droit : hello@dixitapp.tech.
            </p>
          </Section>

          <Section title="6. Propriété intellectuelle">
            <p>
              La plateforme Dixitapp, son code, son design et ses contenus sont la propriété exclusive de Matheo Louro.
              Toute reproduction ou exploitation sans autorisation écrite est interdite.
            </p>
          </Section>

          <Section title="7. Responsabilité">
            <p>
              Dixitapp met tout en œuvre pour assurer la disponibilité et la sécurité de la plateforme.
              La responsabilité de Dixitapp ne saurait être engagée en cas d'interruption de service due à un cas de force majeure ou à des tiers (hébergeur, réseau).
            </p>
          </Section>

          <Section title="8. Droit applicable">
            <p>
              Les présentes CGV sont soumises au <strong>droit français</strong>.
              En cas de litige, les parties s'efforceront de trouver une solution amiable.
              À défaut, le tribunal compétent sera celui de <strong>Bordeaux</strong>.
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

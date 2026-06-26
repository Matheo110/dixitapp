import { useLanguage } from '../context/LanguageContext'

function LangToggle() {
  const { lang, setLanguage } = useLanguage()
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
      <button
        onClick={() => setLanguage('fr')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontWeight: lang === 'fr' ? 700 : 400, color: lang === 'fr' ? '#ffffff' : 'rgba(255,255,255,0.45)' }}
      >
        FR
      </button>
      <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 1px' }}>|</span>
      <button
        onClick={() => setLanguage('en')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontWeight: lang === 'en' ? 700 : 400, color: lang === 'en' ? '#ffffff' : 'rgba(255,255,255,0.45)' }}
      >
        EN
      </button>
    </div>
  )
}

export default function Navbar({ right }) {
  return (
    <nav style={{ backgroundColor: '#1B2B5E' }} className="sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span
          className="font-display font-bold text-white tracking-widest uppercase text-lg select-none"
        >
          DIXITAPP
        </span>
        <div className="flex items-center gap-4">
          <LangToggle />
          {right && <div className="flex items-center gap-4">{right}</div>}
        </div>
      </div>
    </nav>
  )
}

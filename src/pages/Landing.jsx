import { Fragment, useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

// Fade-in + slide-up when element enters viewport
function RevealDiv({ delay = 0, style, children, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Counts up from 0 to target when it enters the viewport
function CountUp({ target, duration = 1500 }) {
  const ref = useRef(null)
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          obs.disconnect()
          let t0 = null
          const tick = (ts) => {
            if (t0 === null) t0 = ts
            const p = Math.min((ts - t0) / duration, 1)
            setCount(Math.floor(p * target))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])
  return <span ref={ref}>{count}</span>
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #E0D8CC' }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1.4rem 0.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem', transition: 'padding-left 0.3s ease' }}
      >
        <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: hover || open ? '#C8102E' : '#1B2B5E', fontSize: '1.05rem', lineHeight: 1.4, transition: 'color 0.3s ease' }}>
          {question}
        </span>
        <span
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(27,43,94,0.18)',
            background: open ? '#1B2B5E' : 'transparent',
            transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? '#F5F0E8' : '#1B2B5E'} strokeWidth="2.5"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s ease' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
          </svg>
        </span>
      </button>
      <div style={{ maxHeight: open ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
        <p style={{ paddingBottom: '1.4rem', paddingRight: '2.5rem', color: '#666', fontSize: '0.925rem', lineHeight: 1.8 }}>
          {answer}
        </p>
      </div>
    </div>
  )
}

const FAQ_FR = [
  { q: "Est-ce vraiment gratuit ?", a: "Oui, l'accès est totalement gratuit pendant la période bêta jusqu'au 1er août 2026. Aucune carte bancaire requise." },
  { q: "Comment mes clients laissent-ils un témoignage ?", a: "Vous générez un lien unique depuis votre dashboard et vous l'envoyez à votre client. Il clique, remplit le formulaire en 2 minutes et c'est tout. Aucun compte requis." },
  { q: "Puis-je collecter des témoignages vidéo ?", a: "Oui ! Vos clients peuvent choisir entre un témoignage écrit ou une vidéo directement depuis leur navigateur." },
  { q: "Comment afficher les témoignages sur mon site ?", a: "Copiez simplement le code iFrame depuis votre dashboard et collez-le sur votre site WordPress, Wix, Squarespace ou tout autre CMS." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Toutes vos données sont hébergées en Europe (Supabase EU) et ne sont jamais partagées ou vendues à des tiers." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. Vous pouvez annuler votre abonnement à tout moment depuis votre dashboard." },
]

const FAQ_EN = [
  { q: "Is it really free?", a: "Yes, access is completely free during the beta period until August 1, 2026. No credit card required." },
  { q: "How do my clients leave a testimonial?", a: "You generate a unique link from your dashboard and send it to your client. They click, fill in the form in 2 minutes and that's it. No account required." },
  { q: "Can I collect video testimonials?", a: "Yes! Your clients can choose between a written testimonial or a video directly from their browser." },
  { q: "How do I display testimonials on my website?", a: "Simply copy the iFrame code from your dashboard and paste it on your WordPress, Wix, Squarespace or any other CMS website." },
  { q: "Is my data secure?", a: "Yes. All your data is hosted in Europe (Supabase EU) and is never shared or sold to third parties." },
  { q: "Can I cancel at any time?", a: "Yes, without commitment. You can cancel your subscription at any time from your dashboard." },
]

const DEMO_FR = [
  { emoji: '📨', title: 'Vous invitez', desc: 'Générez un lien unique et envoyez-le à votre client par email ou message.' },
  { emoji: '⭐', title: 'Ils témoignent', desc: 'Votre client remplit un formulaire simple en 2 minutes. Écrit ou vidéo, sans compte.' },
  { emoji: '✅', title: 'Vous publiez', desc: 'Approuvez le témoignage et intégrez-le directement sur votre site web.' },
]

const DEMO_EN = [
  { emoji: '📨', title: 'You invite', desc: 'Generate a unique link and send it to your client by email or message.' },
  { emoji: '⭐', title: 'They testify', desc: 'Your client fills in a simple form in 2 minutes. Written or video, no account needed.' },
  { emoji: '✅', title: 'You publish', desc: 'Approve the testimonial and embed it directly on your website.' },
]

const TESTIMONIALS_FR = [
  { name: 'Marie L.', role: 'Designer freelance · Paris', rating: 5, quote: "Depuis que j'utilise Dixitapp, je collecte trois fois plus d'avis qu'avant. Mes clients adorent la simplicité du formulaire." },
  { name: 'Julien R.', role: 'Consultant indépendant · Lyon', rating: 5, quote: "L'intégration sur mon site a pris cinq minutes montre en main. Un vrai gain de temps au quotidien." },
  { name: 'Sofia M.', role: 'Coach professionnelle', rating: 5, quote: "Les témoignages vidéo rassurent énormément mes prospects avant qu'ils ne signent. Un vrai plus commercial." },
  { name: 'Thomas B.', role: 'Agence Web · Paris', rating: 5, quote: "Interface soignée, support réactif, résultats immédiats. Exactement ce qu'il nous fallait pour nos clients." },
  { name: 'Camille D.', role: 'Photographe', rating: 5, quote: "Mes clients répondent enfin ! Le formulaire est tellement simple qu'ils le remplissent sans même y penser." },
]

const TESTIMONIALS_EN = [
  { name: 'Marie L.', role: 'Freelance designer · Paris', rating: 5, quote: "Since using Dixitapp I collect three times more reviews than before. My clients love how simple the form is." },
  { name: 'Julien R.', role: 'Independent consultant · Lyon', rating: 5, quote: "Embedding it on my site took five minutes. A genuine time saver in my day to day work." },
  { name: 'Sofia M.', role: 'Professional coach', rating: 5, quote: "Video testimonials reassure my prospects enormously before they sign. A real commercial edge." },
  { name: 'Thomas B.', role: 'Web agency · Paris', rating: 5, quote: "Polished interface, responsive support, immediate results. Exactly what we needed for our clients." },
  { name: 'Camille D.', role: 'Photographer', rating: 5, quote: "My clients finally respond! The form is so simple they fill it in without even thinking about it." },
]

// Soft, slowly drifting gradient-mesh blobs behind the hero content
function GradientMesh() {
  const blobs = [
    { color: 'rgba(27,43,94,0.16)', size: 520, top: '-12%', left: '6%', dur: 22 },
    { color: 'rgba(200,16,46,0.10)', size: 420, top: '30%', left: '70%', dur: 26 },
    { color: 'rgba(27,43,94,0.10)', size: 460, top: '55%', left: '20%', dur: 30 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: b.top, left: b.left,
            width: b.size, height: b.size, borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      ))}
      <div className="grid-mesh" style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}

function ParticleBackground() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      yOffset: -(Math.random() * 20 + 10),
    })), []
  )
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          animate={{ y: [0, p.yOffset, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: '#1B2B5E',
            opacity: 0.14,
          }}
        />
      ))}
    </div>
  )
}

// Floating browser-chrome mockup of the product, tilts gently with the cursor
function ProductMockup({ lang }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateXRaw = useTransform(mouseY, [-160, 160], [5, -5])
  const rotateYRaw = useTransform(mouseX, [-160, 160], [-5, 5])
  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 22 })
  const rotateY = useSpring(rotateYRaw, { stiffness: 150, damping: 22 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0) }

  const cards = [
    { name: 'Marie L.', role: lang === 'en' ? 'Designer · Paris' : 'Designeuse · Paris', quote: lang === 'en' ? 'Incredible service!' : 'Service incroyable !' },
    { name: 'Julien R.', role: lang === 'en' ? 'Consultant · Lyon' : 'Consultant · Lyon', quote: lang === 'en' ? 'Super easy to use.' : 'Très simple à utiliser.' },
    { name: 'Sofia M.', role: lang === 'en' ? 'Coach · Remote' : 'Coach · À distance', quote: lang === 'en' ? 'My clients love it.' : 'Mes clients adorent.' },
    { name: 'Thomas B.', role: lang === 'en' ? 'Agency · Paris' : 'Agence · Paris', quote: lang === 'en' ? 'A real game changer.' : 'Un vrai game changer.' },
  ]

  return (
    <div style={{ perspective: '1800px', marginTop: 'clamp(3rem, 6vw, 4.5rem)', position: 'relative', zIndex: 1 }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          rotateX, rotateY, transformStyle: 'preserve-3d',
          maxWidth: 880, margin: '0 auto', borderRadius: 18,
          background: '#ffffff',
          border: '1px solid rgba(27,43,94,0.08)',
          boxShadow: '0 40px 100px -24px rgba(27,43,94,0.4), 0 16px 40px -12px rgba(27,43,94,0.22), 0 0 0 1px rgba(27,43,94,0.04)',
          overflow: 'hidden',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.2rem', background: 'linear-gradient(180deg, #fbfaf7, #f2efe9)', borderBottom: '1px solid rgba(27,43,94,0.08)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(27,43,94,0.45)', background: 'rgba(27,43,94,0.05)', padding: '0.3rem 1.1rem', borderRadius: 999, fontFamily: 'Inter, sans-serif' }}>
              dixitapp.tech/wall/marie-dupont
            </span>
          </div>
        </div>
        <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', background: 'linear-gradient(180deg, #ffffff, #fbfaf7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1B2B5E', fontSize: '1.2rem' }}>
              {lang === 'en' ? 'Customer reviews' : 'Avis clients'}
            </p>
            <span style={{ fontSize: '0.78rem', color: '#C8102E', fontWeight: 600, background: 'rgba(200,16,46,0.08)', padding: '0.3rem 0.75rem', borderRadius: 999 }}>
              ★ 4.9 / 5
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {cards.map(m => (
              <div key={m.name} style={{ background: '#ffffff', border: '1px solid rgba(27,43,94,0.08)', borderRadius: 12, padding: '1.1rem', boxShadow: '0 2px 12px rgba(27,43,94,0.05)' }}>
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.06em', color: '#C8102E', marginBottom: '0.5rem' }}>★★★★★</div>
                <p style={{ fontSize: '0.82rem', color: '#333', fontStyle: 'italic', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                  "{m.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #1B2B5E, #2d3f7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5F0E8', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.74rem', fontWeight: 600, color: '#1B2B5E' }}>{m.name}</p>
                    <p style={{ fontSize: '0.66rem', color: '#999' }}>{m.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Auto-rotating glassmorphism testimonial carousel
function TestimonialCarousel({ items }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), 5000)
    return () => clearInterval(id)
  }, [paused, items.length])

  const go = (i) => setIndex(((i % items.length) + items.length) % items.length)
  const item = items[index]

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ maxWidth: 640, margin: '3rem auto 0', position: 'relative' }}
    >
      <button
        onClick={() => go(index - 1)}
        aria-label="Previous"
        className="carousel-arrow"
        style={{ left: -18 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2B5E" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        onClick={() => go(index + 1)}
        aria-label="Next"
        className="carousel-arrow"
        style={{ right: -18 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2B5E" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>
      </button>

      <div style={{ minHeight: 230, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card-light"
            style={{ borderRadius: 20, padding: '2.4rem 2.6rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '1.05rem', letterSpacing: '0.1em', color: '#C8102E', marginBottom: '1.1rem' }}>
              {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
            </div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.2rem', color: '#1B2B5E', lineHeight: 1.6, marginBottom: '1.6rem' }}>
              "{item.quote}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #1B2B5E, #2d3f7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5F0E8', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
                {item.name[0]}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, color: '#1B2B5E', fontSize: '0.9rem' }}>{item.name}</p>
                <p style={{ fontSize: '0.78rem', color: '#888' }}>{item.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.6rem' }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === index ? 24 : 8, height: 8, borderRadius: 999,
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === index ? '#1B2B5E' : 'rgba(27,43,94,0.2)',
              transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function StepCard3D({ emoji, title, desc, index }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateXRaw = useTransform(mouseY, [-80, 80], [8, -8])
  const rotateYRaw = useTransform(mouseX, [-80, 80], [-8, 8])
  const rotateX = useSpring(rotateXRaw, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(rotateYRaw, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0) }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass-card"
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        borderRadius: 16,
        padding: '2.25rem 1.75rem',
        textAlign: 'center',
        height: '100%',
        cursor: 'default',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', top: 16, right: 20, fontFamily: 'Playfair Display, serif',
        fontWeight: 700, fontSize: '0.8rem', color: 'rgba(245,240,232,0.35)', letterSpacing: '0.05em',
      }}>
        0{index + 1}
      </div>
      <div style={{ fontSize: '2.5rem', marginBottom: '1.1rem', lineHeight: 1 }}>{emoji}</div>
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: '#F5F0E8', marginBottom: '0.65rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.65)', lineHeight: 1.7 }}>
        {desc}
      </p>
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { lang, setLanguage, t } = useLanguage()
  const heroRef = useRef(null)
  const pricingRef = useRef(null)
  const exitReadyRef = useRef(false)
  const [parallaxY, setParallaxY] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  // Parallax: hero content moves 20% of scroll speed → background peels away slower
  // Also tracks scroll position to give the sticky navbar a glass finish once scrolled
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      if (!heroRef.current) return
      if (heroRef.current.getBoundingClientRect().bottom > 0) {
        setParallaxY(window.scrollY * 0.2)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Exit intent: fires once per session after 5s on page, when mouse leaves toward top
  useEffect(() => {
    const KEY = 'dixitapp_exit_popup'
    if (sessionStorage.getItem(KEY)) return
    const timer = setTimeout(() => { exitReadyRef.current = true }, 5000)
    const onLeave = (e) => {
      if (e.clientY >= 10 || !exitReadyRef.current) return
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, '1')
      setShowPopup(true)
    }
    document.addEventListener('mouseleave', onLeave)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const plans = [
    {
      key: 'free',
      name: 'Free',
      price: '0€',
      period: t.landing.perMonth,
      features: t.landing.planFeatures.free,
      cta: t.landing.planCtaFree,
      featured: false,
      href: '/login',
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '29€',
      period: t.landing.perMonth,
      features: t.landing.planFeatures.pro,
      cta: t.landing.planCtaPro,
      featured: true,
      href: '/pricing',
    },
    {
      key: 'agency',
      name: 'Agency',
      price: '79€',
      period: t.landing.perMonth,
      features: t.landing.planFeatures.agency,
      cta: t.landing.planCtaAgency,
      featured: false,
      href: '/pricing',
      comingSoon: true,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .demo-row { display: flex; align-items: stretch; gap: 1.5rem; }
        .demo-arrow { display: flex; align-items: center; flex-shrink: 0; font-size: 1.5rem; color: rgba(245,240,232,0.35); }
        @media (max-width: 680px) {
          .demo-row { flex-direction: column; }
          .demo-arrow { justify-content: center; font-size: 1.25rem; transform: rotate(90deg); }
        }

        .grid-mesh {
          background-image:
            linear-gradient(rgba(27,43,94,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(27,43,94,0.055) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 25%, black 30%, transparent 90%);
          mask-image: radial-gradient(ellipse 80% 55% at 50% 25%, black 30%, transparent 90%);
        }

        .glass-card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07);
          transition: box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .glass-card:hover {
          border-color: rgba(255,255,255,0.28);
          box-shadow: 0 16px 44px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .glass-card-light {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 20px 60px -12px rgba(27,43,94,0.18), inset 0 1px 0 rgba(255,255,255,0.6);
        }

        .btn-primary {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1B2B5E 0%, #263a78 100%);
          color: #F5F0E8;
          padding: 0.95rem 2.35rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 6px 18px rgba(27,43,94,0.28), 0 1px 2px rgba(27,43,94,0.15);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 44px rgba(27,43,94,0.4), 0 6px 18px rgba(200,16,46,0.16);
        }
        .btn-primary:active { transform: translateY(-1px); }

        .btn-secondary {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #1B2B5E;
          padding: 0.95rem 2.35rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          border: 1.5px solid rgba(27,43,94,0.32);
          cursor: pointer;
          letter-spacing: 0.01em;
          overflow: hidden;
          z-index: 0;
          transition: color 0.45s ease, border-color 0.45s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .btn-secondary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #1B2B5E;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
          z-index: -1;
        }
        .btn-secondary:hover {
          color: #F5F0E8;
          border-color: #1B2B5E;
          transform: translateY(-3px);
        }
        .btn-secondary:hover::before { transform: scaleX(1); }

        .carousel-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(27,43,94,0.12);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 2;
          box-shadow: 0 6px 18px rgba(27,43,94,0.12);
          transition: all 0.3s ease;
        }
        .carousel-arrow:hover {
          background: #1B2B5E;
          transform: translateY(-50%) scale(1.08);
        }
        .carousel-arrow:hover svg { stroke: #F5F0E8; }
        @media (max-width: 720px) {
          .carousel-arrow { display: none; }
        }

        .company-chip {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(27,43,94,0.1);
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .company-chip:hover {
          transform: translateY(-3px);
          border-color: rgba(27,43,94,0.25);
          box-shadow: 0 10px 26px rgba(27,43,94,0.1);
        }

        .footer-link {
          color: rgba(245,240,232,0.55);
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .footer-link:hover { color: #F5F0E8; }

        .nav-btn-ghost, .nav-btn-solid {
          white-space: nowrap;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.55rem 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .nav-btn-ghost {
          background: transparent;
          border: 1px solid rgba(245,240,232,0.5);
          color: #F5F0E8;
          font-weight: 500;
        }
        .nav-btn-ghost:hover {
          background: rgba(245,240,232,0.12);
          border-color: #F5F0E8;
        }
        .nav-btn-solid {
          background: #C8102E;
          border: none;
          color: #F5F0E8;
          box-shadow: 0 4px 14px rgba(200,16,46,0.3);
        }
        .nav-btn-solid:hover {
          background: #a80d26;
          box-shadow: 0 8px 22px rgba(200,16,46,0.45);
          transform: translateY(-1px);
        }
        @media (max-width: 420px) {
          .nav-logo { font-size: 0.95rem; letter-spacing: 0.1em; }
          .nav-btn-ghost, .nav-btn-solid { padding: 0.5rem 0.8rem; font-size: 0.78rem; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          backgroundColor: scrolled ? 'rgba(27,43,94,0.82)' : '#1B2B5E',
          backdropFilter: scrolled ? 'blur(14px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(180%)' : 'none',
          boxShadow: scrolled ? '0 8px 30px rgba(0,0,0,0.18)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          position: 'sticky', top: 0, zIndex: 20,
          transition: 'background-color 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease',
        }}
      >
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.5rem', height: '4.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            className="nav-logo"
            style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#F5F0E8', letterSpacing: '0.16em', fontSize: '1.15rem', textTransform: 'uppercase', userSelect: 'none' }}
          >
            Dixitapp
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', letterSpacing: '0.05em', marginRight: '0.15rem' }}>
              <button
                onClick={() => setLanguage('fr')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontWeight: lang === 'fr' ? 700 : 400, color: lang === 'fr' ? '#ffffff' : 'rgba(255,255,255,0.45)', transition: 'color 0.25s ease' }}
              >
                FR
              </button>
              <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 1px' }}>|</span>
              <button
                onClick={() => setLanguage('en')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontWeight: lang === 'en' ? 700 : 400, color: lang === 'en' ? '#ffffff' : 'rgba(255,255,255,0.45)', transition: 'color 0.25s ease' }}
              >
                EN
              </button>
            </div>
            <button className="nav-btn-ghost" onClick={() => navigate('/login')}>
              {t.nav.login}
            </button>
            <button className="nav-btn-solid" onClick={() => navigate('/login?tab=signup')}>
              {t.nav.signup}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          background: 'linear-gradient(180deg, #F8F4EC 0%, #F5F0E8 55%, #F0EAE0 100%)',
          padding: 'clamp(4.5rem, 10vw, 7.5rem) 1.5rem clamp(3.5rem, 8vw, 6rem)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <GradientMesh />
        <ParticleBackground />
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            textAlign: 'center',
            transform: `translateY(${parallaxY}px)`,
            willChange: 'transform',
            position: 'relative',
            zIndex: 1,
            perspective: '1200px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 1.1rem', borderRadius: 999,
              background: 'rgba(27,43,94,0.06)', border: '1px solid rgba(27,43,94,0.14)',
              marginBottom: '2rem',
            }}
          >
            <span style={{ color: '#C8102E', fontSize: '0.85rem', letterSpacing: '0.05em' }}>★★★★★</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B2B5E' }}>
              <CountUp target={234} />+ {lang === 'en' ? 'freelancers trust us' : 'freelances nous font confiance'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ rotateX: -90, opacity: 0, y: 30 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 6vw, 4.25rem)',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #1B2B5E 0%, #33488c 50%, #1B2B5E 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.12,
              marginBottom: '1.1rem',
              transformOrigin: 'center top',
            }}
          >
            {t.landing.welcome}
          </motion.h1>
          <motion.p
            initial={{ rotateX: -80, opacity: 0, y: 20 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '1.5rem',
              color: '#1B2B5E',
              lineHeight: 1.35,
              marginBottom: '1.4rem',
              transformOrigin: 'center top',
            }}
          >
            {t.landing.subtitle}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{
              fontSize: '1rem',
              color: '#666',
              lineHeight: 1.75,
              maxWidth: '560px',
              margin: '0 auto 2.5rem',
            }}
          >
            {t.landing.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            <button className="btn-primary" onClick={() => navigate('/login')}>
              {t.landing.ctaStart}
            </button>
            <button className="btn-secondary" onClick={scrollToPricing}>
              {t.landing.ctaPlans}
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            style={{ fontSize: '0.8rem', color: '#999', letterSpacing: '0.02em' }}
          >
            {lang === 'en' ? 'No credit card required · Free during beta' : 'Aucune carte bancaire · Gratuit pendant la bêta'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductMockup lang={lang} />
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ background: 'linear-gradient(180deg, #F0EAE0 0%, #F5F0E8 100%)', padding: 'clamp(3.5rem, 7vw, 5.5rem) 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <RevealDiv>
            <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.5rem', color: '#1B2B5E', marginBottom: '0.5rem' }}>
              {lang === 'en' ? 'They trust us' : 'Ils nous font confiance'}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '2.5rem' }}>
              {lang === 'en'
                ? 'French freelancers and agencies use Dixitapp every day'
                : 'Des freelances et agences français utilisent Dixitapp au quotidien'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
              {['Studio Créatif', 'Agence Web Lyon', 'Design & Co', 'FreelancePro', 'Atelier Numérique', 'Conseil & Stratégie'].map(name => (
                <div
                  key={name}
                  className="company-chip"
                  style={{ borderRadius: '10px', padding: '1rem 1.5rem', fontFamily: 'Inter, sans-serif', color: '#1B2B5E', fontWeight: 500, fontSize: '0.875rem' }}
                >
                  {name}
                </div>
              ))}
            </div>
            <TestimonialCarousel items={lang === 'en' ? TESTIMONIALS_EN : TESTIMONIALS_FR} />
          </RevealDiv>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section style={{ background: 'linear-gradient(160deg, #1B2B5E 0%, #16244d 100%)', padding: 'clamp(4.5rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <RevealDiv>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', letterSpacing: '-0.01em', color: '#F5F0E8', textAlign: 'center', marginBottom: '0.75rem' }}>
              {lang === 'en' ? 'See Dixitapp in action' : 'Voyez Dixitapp en action'}
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(245,240,232,0.6)', fontSize: '0.975rem', marginBottom: '1rem' }}>
              {lang === 'en' ? 'From invitation to publication in less than 2 minutes' : "De l'invitation à la publication en moins de 2 minutes"}
            </p>
            <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg, transparent, #C8102E, transparent)', borderRadius: '9999px', margin: '0 auto 4rem' }} />
          </RevealDiv>

          <div className="demo-row" style={{ perspective: '1000px' }}>
            {(lang === 'en' ? DEMO_EN : DEMO_FR).map((step, i) => (
              <Fragment key={step.title}>
                <RevealDiv delay={i * 180} style={{ flex: 1 }}>
                  <StepCard3D emoji={step.emoji} title={step.title} desc={step.desc} index={i} />
                </RevealDiv>
                {i < 2 && (
                  <div className="demo-arrow">→</div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section ref={pricingRef} style={{ background: 'linear-gradient(180deg, #F5F0E8 0%, #F8F4EC 100%)', padding: 'clamp(4.5rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <RevealDiv>
            <h2
              style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', letterSpacing: '-0.01em', color: '#1B2B5E', textAlign: 'center', marginBottom: '0.85rem' }}
            >
              {t.landing.pricingTitle}
            </h2>
            <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg, transparent, #C8102E, transparent)', borderRadius: '9999px', margin: '0 auto 4rem' }} />
          </RevealDiv>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.75rem' }}>
            {plans.map((plan, i) => (
              <RevealDiv key={plan.key} delay={i * 150} style={{ height: '100%', perspective: '1000px' }}>
                <motion.div
                  whileHover={{
                    y: -8,
                    rotateX: -2,
                    rotateY: 2,
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '1.1rem',
                    padding: '2rem 1.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    border: plan.featured ? '1.5px solid rgba(200,16,46,0.35)' : '1px solid #E0D8CC',
                    boxShadow: plan.featured
                      ? '0 24px 60px -16px rgba(200,16,46,0.22), 0 8px 24px rgba(27,43,94,0.08)'
                      : '0 8px 30px rgba(27,43,94,0.06)',
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                  }}
                >
                  {plan.featured && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ backgroundColor: '#C8102E', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.85rem', borderRadius: '9999px', boxShadow: '0 4px 14px rgba(200,16,46,0.35)' }}>
                        {t.landing.recommended}
                      </span>
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.3rem', color: '#1B2B5E', marginBottom: '0.35rem' }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.3rem', marginBottom: '1.6rem' }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2.6rem', letterSpacing: '-0.01em', color: plan.featured ? '#C8102E' : '#1B2B5E' }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(27,43,94,0.45)', marginBottom: '0.35rem' }}>
                      {plan.period}
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: 'rgba(27,43,94,0.72)' }}>
                        <svg style={{ width: 17, height: 17, flexShrink: 0, marginTop: 2, color: '#C8102E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                        {plan.comingSoon && (
                          <em style={{ fontSize: '0.72rem', color: '#888', fontStyle: 'italic', marginLeft: '0.2rem', flexShrink: 0 }}>
                            {lang === 'en' ? '(soon)' : '(bientôt)'}
                          </em>
                        )}
                      </li>
                    ))}
                  </ul>
                  {plan.comingSoon ? (
                    <div style={{ textAlign: 'center' }}>
                      <button
                        disabled
                        style={{ backgroundColor: '#888', color: '#F5F0E8', width: '100%', padding: '0.8rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: 'not-allowed', opacity: 0.6 }}
                      >
                        {plan.cta}
                      </button>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#888', fontStyle: 'italic' }}>
                        {lang === 'en' ? 'Coming soon' : 'Bientôt disponible'}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(plan.href)}
                      className={plan.featured ? 'btn-primary' : ''}
                      style={plan.featured
                        ? { width: '100%', padding: '0.8rem', backgroundColor: undefined, background: 'linear-gradient(135deg, #C8102E, #a80d26)', boxShadow: '0 6px 18px rgba(200,16,46,0.32)' }
                        : { backgroundColor: '#1B2B5E', color: '#F5F0E8', width: '100%', padding: '0.8rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }
                      }
                      onMouseEnter={e => { if (!plan.featured) e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={e => { if (!plan.featured) e.currentTarget.style.opacity = '1' }}
                    >
                      {plan.cta}
                    </button>
                  )}
                </motion.div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#ffffff', padding: 'clamp(4.5rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <RevealDiv>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', letterSpacing: '-0.01em', color: '#1B2B5E', textAlign: 'center', marginBottom: '0.85rem' }}>
              {lang === 'en' ? 'Frequently asked questions' : 'Questions fréquentes'}
            </h2>
            <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg, transparent, #C8102E, transparent)', borderRadius: '9999px', margin: '0 auto 3.5rem' }} />
          </RevealDiv>
          <RevealDiv delay={100}>
            <div style={{ backgroundColor: '#fffef9', borderRadius: '16px', border: '1px solid #E0D8CC', padding: '0 2rem', boxShadow: '0 20px 50px -20px rgba(27,43,94,0.1)' }}>
              {(lang === 'en' ? FAQ_EN : FAQ_FR).map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* ── EXIT INTENT POPUP ── */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowPopup(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '2.75rem', maxWidth: '440px', width: '100%', borderTop: '4px solid #C8102E', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)' }}
            >
              <h2
                style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.7rem', color: '#1B2B5E', marginBottom: '0.75rem' }}
              >
                {lang === 'en' ? 'Wait! 🎁' : 'Attendez ! 🎁'}
              </h2>
              <p style={{ fontWeight: 600, color: '#1B2B5E', fontSize: '1rem', marginBottom: '0.5rem' }}>
                {lang === 'en' ? 'Try Dixitapp for free before you leave' : 'Essayez Dixitapp gratuitement avant de partir'}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.65, marginBottom: '1.85rem' }}>
                {lang === 'en' ? 'Full access during beta. No credit card required.' : 'Accès complet pendant la bêta. Aucune carte bancaire requise.'}
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                {lang === 'en' ? 'Get started for free' : 'Commencer gratuitement'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowPopup(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '0.85rem', transition: 'color 0.25s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1B2B5E')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                >
                  {lang === 'en' ? 'No thanks' : 'Non merci'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'linear-gradient(160deg, #111827, #0b1220)', padding: '1.5rem 2.5rem', textAlign: 'center', marginTop: 'auto' }}>
        <span style={{ color: 'rgba(245,240,232,0.55)', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
        <span style={{ color: 'rgba(245,240,232,0.25)', fontSize: '0.8rem', margin: '0 0.5rem' }}>·</span>
        <a href="/cgv" className="footer-link" style={{ fontSize: '0.8rem' }}>CGV</a>
        <span style={{ color: 'rgba(245,240,232,0.25)', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/mentions" className="footer-link" style={{ fontSize: '0.8rem' }}>Mentions légales</a>
        <span style={{ color: 'rgba(245,240,232,0.25)', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/privacy" className="footer-link" style={{ fontSize: '0.8rem' }}>Confidentialité</a>
      </footer>

    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

const EMPTY = { name: '', message: '', rating: 0 }

const inputBase = {
  backgroundColor: '#F5F0E8',
  border: '1.5px solid rgba(27,43,94,0.2)',
  color: '#1B2B5E',
}
const onFocus = e => (e.target.style.borderColor = 'rgba(27,43,94,0.5)')
const onBlur  = e => (e.target.style.borderColor = 'rgba(27,43,94,0.2)')

export default function Collect() {
  const { slug: ownerId } = useParams()

  // Mode: null | 'text' | 'video'
  const [mode, setMode] = useState(null)

  // Text mode
  const [form, setForm] = useState(EMPTY)

  // Video mode
  const [videoName, setVideoName] = useState('')
  const [videoRating, setVideoRating] = useState(0)
  const [recordState, setRecordState] = useState('idle') // 'idle' | 'recording' | 'preview'
  const [videoBlobUrl, setVideoBlobUrl] = useState(null)
  const liveVideoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  // Common
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl)
    }
  }, [videoBlobUrl])

  const field = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))
  const setRating = (star) => setForm(prev => ({ ...prev, rating: prev.rating === star ? 0 : star }))

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl)
    setVideoBlobUrl(null)
    setRecordState('idle')
    mediaRecorderRef.current = null
    streamRef.current = null
  }

  // Attach stream to live video element after React renders it
  useEffect(() => {
    if (recordState === 'recording' && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current
    }
  }, [recordState])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      const chunks = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlobUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        setRecordState('preview')
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecordState('recording') // triggers re-render → <video> mounts → effect sets srcObject
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
  }

  const resetRecording = () => {
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl)
    setVideoBlobUrl(null)
    setRecordState('idle')
    mediaRecorderRef.current = null
    streamRef.current = null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ownerId || !mode) return

    const name = (mode === 'text' ? form.name : videoName).trim()
    if (!name) { setError('Veuillez saisir votre prénom.'); return }
    if (mode === 'video' && recordState !== 'preview') {
      setError('Veuillez enregistrer votre témoignage vidéo avant d\'envoyer.')
      return
    }

    setLoading(true)
    setError(null)

    // Upload video to Supabase Storage if in video mode
    let videoUrl = null
    if (mode === 'video' && videoBlobUrl) {
      try {
        const res = await fetch(videoBlobUrl)
        const blob = await res.blob()
        const rand = Math.random().toString(36).slice(2, 8)
        const filename = `${Date.now()}-${rand}.webm`
        const { error: uploadError } = await supabase.storage
          .from('video')
          .upload(filename, blob, { contentType: 'video/webm' })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('video')
          .getPublicUrl(filename)
        videoUrl = publicUrl
      } catch (err) {
        setError(`Erreur lors de l'envoi de la vidéo : ${err.message}`)
        setLoading(false)
        return
      }
    }

    const payload = {
      user_id: ownerId,
      name,
      company: null,
      role: null,
      message: mode === 'text' ? form.message.trim() : '[Témoignage vidéo]',
      rating: mode === 'text' ? (form.rating || null) : (videoRating || null),
      approved: false,
      video_url: videoUrl,
    }

    const { error } = await supabase.from('testimonials').insert(payload).select()

    if (error) {
      setError(`Erreur : ${error.message}`)
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(27,43,94,0.08)' }}
            >
              <svg className="w-8 h-8" style={{ color: '#1B2B5E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-3xl mb-3" style={{ color: '#1B2B5E' }}>Merci !</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(27,43,94,0.55)' }}>
              Votre témoignage a bien été envoyé et est en attente de validation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const showSubmit = mode === 'text' || (mode === 'video' && recordState === 'preview')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar />

      <div className="flex-1 py-14 px-4">
        <div className="max-w-xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-10">
            <h1
              className="font-display font-bold leading-tight mb-3"
              style={{ color: '#1B2B5E', fontSize: '2.5rem' }}
            >
              Partagez votre expérience
            </h1>
            <p className="text-sm" style={{ color: 'rgba(27,43,94,0.5)' }}>
              Votre avis compte. Merci de prendre 2 minutes.
            </p>
            <div className="mx-auto mt-5 rounded-full" style={{ width: 40, height: 3, backgroundColor: '#C8102E' }} />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div style={{ height: 4, backgroundColor: '#C8102E' }} />

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

              {/* Mode selector */}
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: '#1B2B5E' }}>
                  Comment souhaitez-vous laisser votre témoignage ?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'text', icon: '✍️', label: 'Témoignage écrit' },
                    { key: 'video', icon: '🎥', label: 'Témoignage vidéo' },
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => switchMode(key)}
                      className="flex flex-col items-center gap-2 py-5 rounded-xl font-medium text-sm transition-all"
                      style={
                        mode === key
                          ? { backgroundColor: '#1B2B5E', color: '#F5F0E8', border: '2px solid #1B2B5E' }
                          : { backgroundColor: 'transparent', color: '#1B2B5E', border: '2px solid #1B2B5E' }
                      }
                    >
                      <span className="text-2xl">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Text mode ── */}
              {mode === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                      Votre prénom <span style={{ color: '#C8102E' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={field('name')}
                      required
                      placeholder="Votre prénom"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                      Votre témoignage <span style={{ color: '#C8102E' }}>*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={field('message')}
                      required
                      rows={5}
                      placeholder="Votre témoignage…"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2.5" style={{ color: '#1B2B5E' }}>
                      Votre note{' '}
                      <span className="font-normal text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>(optionnel)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-3xl leading-none transition-transform hover:scale-110 active:scale-95"
                          style={{ color: star <= form.rating ? '#C8102E' : 'rgba(27,43,94,0.2)' }}
                          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                      {form.rating > 0 && (
                        <button
                          type="button"
                          onClick={() => setRating(0)}
                          className="ml-2 text-xs transition-colors"
                          style={{ color: 'rgba(27,43,94,0.35)' }}
                          onMouseEnter={e => (e.target.style.color = 'rgba(27,43,94,0.6)')}
                          onMouseLeave={e => (e.target.style.color = 'rgba(27,43,94,0.35)')}
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Video mode ── */}
              {mode === 'video' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5E' }}>
                      Votre prénom <span style={{ color: '#C8102E' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={videoName}
                      onChange={e => setVideoName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* Camera area */}
                  <div
                    className="rounded-xl overflow-hidden relative flex items-center justify-center"
                    style={{ backgroundColor: '#0d0d0d', aspectRatio: '16/9' }}
                  >
                    {recordState === 'idle' && (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                        style={{ backgroundColor: '#1B2B5E', color: '#F5F0E8' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#253d82')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1B2B5E')}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                        Démarrer l'enregistrement
                      </button>
                    )}

                    {recordState === 'recording' && (
                      <>
                        <video
                          ref={liveVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div
                          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#C8102E', animation: 'pulse 1.5s infinite' }}
                          />
                          <span className="text-white text-xs font-medium">Enregistrement</span>
                        </div>
                        <div className="absolute bottom-3 inset-x-0 flex justify-center">
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            style={{ backgroundColor: '#C8102E', color: '#ffffff' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#a80d26')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8102E')}
                          >
                            Arrêter et envoyer
                          </button>
                        </div>
                      </>
                    )}

                    {recordState === 'preview' && (
                      <video
                        src={videoBlobUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {recordState === 'preview' && (
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="text-xs transition-colors"
                      style={{ color: 'rgba(27,43,94,0.4)' }}
                      onMouseEnter={e => (e.target.style.color = '#1B2B5E')}
                      onMouseLeave={e => (e.target.style.color = 'rgba(27,43,94,0.4)')}
                    >
                      ↩ Recommencer l'enregistrement
                    </button>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2.5" style={{ color: '#1B2B5E' }}>
                      Votre note{' '}
                      <span className="font-normal text-xs" style={{ color: 'rgba(27,43,94,0.4)' }}>(optionnel)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setVideoRating(prev => prev === star ? 0 : star)}
                          className="text-3xl leading-none transition-transform hover:scale-110 active:scale-95"
                          style={{ color: star <= videoRating ? '#C8102E' : '#888888' }}
                          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                      {videoRating > 0 && (
                        <button
                          type="button"
                          onClick={() => setVideoRating(0)}
                          className="ml-2 text-xs transition-colors"
                          style={{ color: 'rgba(27,43,94,0.35)' }}
                          onMouseEnter={e => (e.target.style.color = 'rgba(27,43,94,0.6)')}
                          onMouseLeave={e => (e.target.style.color = 'rgba(27,43,94,0.35)')}
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

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

              {showSubmit && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#C8102E' }}
                  onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#a80d26')}
                  onMouseLeave={e => (e.target.style.backgroundColor = '#C8102E')}
                >
                  {loading ? 'Envoi en cours…' : 'Envoyer mon témoignage'}
                </button>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

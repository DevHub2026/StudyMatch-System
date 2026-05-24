import { useState, useEffect } from 'react'
import { getMyFeedback, submitFeedback } from '../../api/feedback'
import { Star, Send, CheckCircle, Loader2, RefreshCw } from 'lucide-react'

const TYPES = ['General', 'Bug Report', 'Feature Request', 'Tutor Feedback', 'Session Feedback']

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i} size={28} cursor="pointer"
          color="#F59E0B"
          fill={(hover || value) >= i ? '#F59E0B' : 'none'}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        />
      ))}
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  const [form, setForm] = useState({ type: 'General', message: '', rating: 0 })

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const res  = await getMyFeedback()
      const data = res?.data || res || []
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchFeedback() }, [])

  const handleSubmit = async () => {
    if (!form.message.trim()) { setError('Please enter a message.'); return }
    if (form.rating === 0)    { setError('Please select a rating.'); return }
    setError('')
    setSubmitting(true)
    try {
      await submitFeedback(form.type, form.message, form.rating)
      setSuccess(true)
      setForm({ type: 'General', message: '', rating: 0 })
      fetchFeedback()
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .fb-wrap * { box-sizing: border-box; }
        .fb-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
        .fb-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; color: #374151; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .fb-input:focus { border-color: #7C3AED; }
        .fb-label { font-size: 12.5px; font-weight: 600; color: #6B7280; display: block; margin-bottom: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="fb-wrap">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Feedback</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Help us improve StudyMatch by sharing your thoughts.</p>
        </div>

        {/* Submit form */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Submit Feedback</div>

          {error   && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13.5, color: '#EF4444', marginBottom: 14 }}>{error}</div>}
          {success && (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, fontSize: 13.5, color: '#10B981', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle size={15} /> Feedback submitted successfully! Thank you.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Type */}
            <div>
              <label className="fb-label">Feedback Type</label>
              <select className="fb-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="fb-label">Rating</label>
              <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
            </div>

            {/* Message */}
            <div>
              <label className="fb-label">Message</label>
              <textarea
                className="fb-input" rows={5}
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Share your thoughts, suggestions, or report an issue..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <button onClick={handleSubmit} disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px', background: '#7C3AED', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>

        {/* My feedback history */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>
            My Previous Feedback
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : feedbacks.length === 0 ? (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No feedback submitted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feedbacks.map((f, i) => (
                <div key={f.id || i} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7C3AED', background: '#F3F0FF', borderRadius: 20, padding: '2px 10px', marginRight: 8 }}>
                        {f.type || 'General'}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(f.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={13} color="#F59E0B" fill={s <= (f.rating || 0) ? '#F59E0B' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
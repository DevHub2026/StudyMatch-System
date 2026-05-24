import { useState, useEffect } from 'react'
import { getMyTickets, submitTicket } from '../../api/helpCenter'
import { HelpCircle, Send, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = ['Account', 'Technical', 'Billing', 'Sessions', 'Tutors', 'Safety', 'Other']
const PRIORITIES  = ['low', 'medium', 'high']

const STATUS_MAP = {
  open:        { label: 'Open',        color: '#7C3AED', bg: '#F3F0FF' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
  resolved:    { label: 'Resolved',    color: '#10B981', bg: '#F0FDF4' },
  closed:      { label: 'Closed',      color: '#6B7280', bg: '#F9FAFB' },
}

const FAQS = [
  { q: 'How do I find a tutor?',                    a: 'Go to "Find Tutors" from the sidebar, browse available tutors, and send a match request.' },
  { q: 'How do I schedule a session?',              a: 'Once matched with a tutor, go to "Study Sessions" and click "New Session" to book.' },
  { q: 'How do I cancel a session?',                a: 'Open the session in "Study Sessions", click the ⋮ menu, and select "Cancel Session".' },
  { q: 'What if my tutor doesn\'t show up?',        a: 'Wait 10 minutes then report it via the session page. Our team will follow up within 24 hours.' },
  { q: 'How do I update my profile?',               a: 'Go to "Profile" from the sidebar and click "Edit Profile" to update your information.' },
]

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function HelpCenterPage() {
  const [tickets,   setTickets]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [openFaq,   setOpenFaq]   = useState(null)

  const [form, setForm] = useState({
    subject: '', category: 'Account', description: '', priority: 'medium',
  })

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res  = await getMyTickets()
      const data = res?.data || res || []
      setTickets(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async () => {
    if (!form.subject.trim())     { setError('Please enter a subject.'); return }
    if (!form.description.trim()) { setError('Please describe your issue.'); return }
    setError('')
    setSubmitting(true)
    try {
      await submitTicket(form.subject, form.category, form.description, form.priority)
      setSuccess(true)
      setForm({ subject: '', category: 'Account', description: '', priority: 'medium' })
      fetchTickets()
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .hc-wrap * { box-sizing: border-box; }
        .hc-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
        .hc-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; color: #374151; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .hc-input:focus { border-color: #7C3AED; }
        .hc-label { font-size: 12.5px; font-weight: 600; color: #6B7280; display: block; margin-bottom: 6px; }
        .faq-row { padding: 14px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; }
        .faq-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="hc-wrap">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Help Center</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Get help and support for any issues.</p>
        </div>

        {/* FAQs */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Frequently Asked Questions</div>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-row" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp size={16} color="#7C3AED" />
                  : <ChevronDown size={16} color="#9CA3AF" />
                }
              </div>
              {openFaq === i && (
                <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, margin: '10px 0 0' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        {/* Submit ticket */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={17} color="#7C3AED" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Submit a Support Ticket</span>
          </div>

          {error   && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13.5, color: '#EF4444', marginBottom: 14 }}>{error}</div>}
          {success && (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, fontSize: 13.5, color: '#10B981', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle size={15} /> Ticket submitted! We'll get back to you soon.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="hc-label">Subject</label>
              <input className="hc-input" type="text" placeholder="Brief description of your issue"
                value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="hc-label">Category</label>
                <select className="hc-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="hc-label">Priority</label>
                <select className="hc-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="hc-label">Description</label>
              <textarea className="hc-input" rows={5}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your issue in detail..."
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
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>

        {/* My tickets */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>My Support Tickets</div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No support tickets yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tickets.map((t, i) => {
                const s = STATUS_MAP[t.status?.toLowerCase()] || STATUS_MAP.open
                return (
                  <div key={t.id || i} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 3 }}>{t.subject}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', background: '#F3F0FF', borderRadius: 20, padding: '1px 8px' }}>{t.category}</span>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(t.created_at)}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{t.description}</p>
                    {t.admin_response && (
                      <div style={{ marginTop: 10, padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, fontSize: 13, color: '#6B7280' }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Support response: </span>
                        {t.admin_response}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
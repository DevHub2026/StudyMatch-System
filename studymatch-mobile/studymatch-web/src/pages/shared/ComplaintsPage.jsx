import { useState, useEffect } from 'react'
import { getMyComplaints, submitComplaint } from '../../api/complaints'
import { Flag, Send, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

const CATEGORIES = ['Harassment', 'Spam', 'Inappropriate Content', 'Academic Misconduct', 'Cheating', 'Other']

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_MAP = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FFFBEB' },
  reviewed:  { label: 'Reviewed',  color: '#6366F1', bg: '#EEF2FF' },
  resolved:  { label: 'Resolved',  color: '#10B981', bg: '#F0FDF4' },
  dismissed: { label: 'Dismissed', color: '#6B7280', bg: '#F9FAFB' },
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)

  const [form, setForm] = useState({
    reported_user_id: '', category: 'Harassment', description: '',
  })

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res  = await getMyComplaints()
      const data = res?.data || res || []
      setComplaints(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchComplaints() }, [])

  const handleSubmit = async () => {
    if (!form.reported_user_id.trim()) { setError('Please enter the user ID.'); return }
    if (!form.description.trim())      { setError('Please provide a description.'); return }
    setError('')
    setSubmitting(true)
    try {
      await submitComplaint(form.reported_user_id, form.category, form.description)
      setSuccess(true)
      setForm({ reported_user_id: '', category: 'Harassment', description: '' })
      fetchComplaints()
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError('Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .cp-wrap * { box-sizing: border-box; }
        .cp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
        .cp-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; color: #374151; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .cp-input:focus { border-color: '#7C3AED'; }
        .cp-label { font-size: 12.5px; font-weight: 600; color: #6B7280; display: block; margin-bottom: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cp-wrap">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Complaints</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Report issues or inappropriate behavior.</p>
        </div>

        {/* Warning banner */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
            Please only submit complaints for genuine issues. False reports may result in account action. All complaints are reviewed by our moderation team.
          </div>
        </div>

        {/* Submit form */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Submit a Complaint</div>

          {error   && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13.5, color: '#EF4444', marginBottom: 14 }}>{error}</div>}
          {success && (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, fontSize: 13.5, color: '#10B981', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle size={15} /> Complaint submitted. Our team will review it shortly.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="cp-label">Reported User ID</label>
              <input className="cp-input" type="text" placeholder="Enter user ID or username"
                value={form.reported_user_id} onChange={e => setForm(p => ({ ...p, reported_user_id: e.target.value }))} />
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>You can find the user ID on their profile page.</div>
            </div>

            <div>
              <label className="cp-label">Category</label>
              <select className="cp-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="cp-label">Description</label>
              <textarea className="cp-input" rows={5}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the issue in detail. Include relevant dates, times, and any evidence..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <button onClick={handleSubmit} disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px', background: '#EF4444', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Flag size={15} />}
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>

        {/* My complaints */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>My Complaints</div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No complaints submitted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {complaints.map((c, i) => {
                const s = STATUS_MAP[c.status?.toLowerCase()] || STATUS_MAP.pending
                return (
                  <div key={c.id || i} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Flag size={14} color="#EF4444" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>{c.category || 'Complaint'}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(c.created_at)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '3px 10px' }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{c.description}</p>
                    {c.admin_response && (
                      <div style={{ marginTop: 10, padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, fontSize: 13, color: '#6B7280' }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Admin response: </span>
                        {c.admin_response}
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
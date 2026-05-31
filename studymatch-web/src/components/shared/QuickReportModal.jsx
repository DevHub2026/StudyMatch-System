import { useState } from 'react'
import { X, Flag, CheckCircle, Loader2 } from 'lucide-react'
import { submitComplaint } from '../../api/complaints'

const REASONS = [
  { key: 'spam',          label: 'Spam or misleading information' },
  { key: 'harassment',    label: 'Harassment or bullying'         },
  { key: 'inappropriate', label: 'Inappropriate content'          },
  { key: 'fake',          label: 'Fake profile or impersonation'  },
  { key: 'other',         label: 'Other'                          },
]

export default function QuickReportModal({ reportedUserId, reportedName, onClose }) {
  const [reason,      setReason]      = useState('')
  const [description, setDescription] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  const handleSubmit = async () => {
    if (!reason) { setError('Please select a reason.'); return }
    setError(''); setSubmitting(true)
    try {
      await submitComplaint(reportedUserId, reason, description.trim() || reason)
      setSuccess(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit report. Please try again.')
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '28px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,.15)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag size={18} color="#EF4444" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B' }}>Report User</div>
              {reportedName && <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 1 }}>{reportedName}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={44} color="#10B981" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 6 }}>Report Submitted</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Thank you. Our team will review this report.</div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13, color: '#EF4444', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              What's the issue?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {REASONS.map(r => (
                <label key={r.key} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${reason === r.key ? '#7C3AED' : '#E5E7EB'}`,
                  background: reason === r.key ? '#F3F0FF' : 'white',
                  transition: 'all .12s',
                }}>
                  <input
                    type="radio" name="report_reason" value={r.key}
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                    style={{ accentColor: '#7C3AED', width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: reason === r.key ? '#7C3AED' : '#374151' }}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide more context about this report…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid #E5E7EB', borderRadius: 10,
                  fontSize: 13.5, color: '#374151', resize: 'none',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '11px', border: '1.5px solid #E5E7EB',
                borderRadius: 10, background: 'white', color: '#374151',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting || !reason} style={{
                flex: 2, padding: '11px', border: 'none', borderRadius: 10,
                background: !reason ? '#E5E7EB' : '#EF4444', color: !reason ? '#9CA3AF' : 'white',
                fontSize: 14, fontWeight: 700, cursor: (!reason || submitting) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'background .15s',
              }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Flag size={15} />}
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

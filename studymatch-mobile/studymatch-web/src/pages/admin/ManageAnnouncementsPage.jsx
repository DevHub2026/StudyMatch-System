import { useState } from 'react'
import { Megaphone, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react'

const INITIAL = [
  { id: 1, title: 'Platform Maintenance',  message: 'StudyMatch will undergo maintenance this Saturday.',   date: 'May 26, 2024', status: 'published' },
  { id: 2, title: 'Exam Week Reminder',    message: 'Good luck to all students during finals week!',         date: 'May 24, 2024', status: 'published' },
]

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(INITIAL)
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleAdd = () => {
    if (!title.trim() || !message.trim()) { setError('Please fill in both fields.'); return }
    setError('')
    const newAnn = {
      id: Date.now(), title: title.trim(), message: message.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'published',
    }
    setAnnouncements(prev => [newAnn, ...prev])
    setTitle(''); setMessage('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleDelete = (id) => setAnnouncements(prev => prev.filter(a => a.id !== id))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ann-wrap * { box-sizing: border-box; }
        .ann-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 20px; }
        .ann-input {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #E5E7EB; border-radius: 10px;
          font-size: 14px; color: #374151; outline: none;
          font-family: 'DM Sans', sans-serif; transition: border-color .15s;
        }
        .ann-input:focus { border-color: #7C3AED; }
        .ann-textarea { resize: vertical; min-height: 100px; }
        .ann-card { background: white; border: 1px solid #F0F0F4; border-radius: 16px; padding: 20px 22px; transition: box-shadow .18s; }
        .ann-card:hover { box-shadow: 0 4px 18px rgba(124,58,237,.07); }
      `}</style>

      <div className="ann-wrap">
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Announcements</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Create and manage platform-wide announcements.</p>
        </div>

        {/* Create form */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={17} color="#7C3AED" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B' }}>Create Announcement</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error   && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13, color: '#EF4444' }}>{error}</div>}
            {success && (
              <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle size={14} /> Announcement published successfully!
              </div>
            )}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Title</label>
              <input className="ann-input" type="text" placeholder="Announcement title..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Message</label>
              <textarea className="ann-input ann-textarea" placeholder="Write your announcement message..." value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <button onClick={handleAdd} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px', background: '#7C3AED', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
            >
              <Plus size={16} /> Publish Announcement
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>
          Published Announcements ({announcements.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map(a => (
            <div key={a.id} className="ann-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{a.title}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '2px 9px' }}>
                      Published
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{a.message}</p>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>{a.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={14} color="#6B7280" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
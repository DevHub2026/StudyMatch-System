import { useState } from 'react'
import { Plus, Trophy, BookOpen } from 'lucide-react'
import { getUser } from '../../store/authStore'

/* ─── donut chart (empty state — 0%) ────────────────────────── */

function DonutChart() {
  const r = 54, cx = 70, cy = 70
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={140} height={140}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={14} />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#1E1B4B" fontFamily="DM Sans, sans-serif">0%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="DM Sans, sans-serif">Overall</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Completed',   pct: '0%', color: '#7C3AED' },
          { label: 'In Progress', pct: '0%', color: '#A78BFA' },
          { label: 'Not Started', pct: '0%', color: '#E5E7EB' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B', marginLeft: 4 }}>{pct}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── add subject modal ──────────────────────────────────────── */

function AddSubjectModal({ onClose, onAdd }) {
  const [name,     setName]     = useState('')
  const [category, setCategory] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), category: category.trim() || 'General' })
    onClose()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', borderRadius: 20, padding: 32, zIndex: 101, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,.15)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1E1B4B' }}>Add New Subject</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Subject Name', value: name,     set: setName,     ph: 'e.g. Calculus, Physics...' },
            { label: 'Category',     value: category, set: setCategory, ph: 'e.g. Mathematics, Science...' },
          ].map(({ label, value, set, ph }) => (
            <div key={label}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
              <input value={value} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13.5, color: '#1E1B4B', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.currentTarget.style.borderColor = '#7C3AED'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleAdd} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 10, background: '#7C3AED', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add Subject</button>
        </div>
      </div>
    </>
  )
}

/* ─── subject card ───────────────────────────────────────────── */

const COLORS = ['#7C3AED','#6366F1','#10B981','#F59E0B','#EF4444','#EC4899']
const BGS    = ['#F3F0FF','#EEF2FF','#F0FDF4','#FFFBEB','#FEF2F2','#FDF2F8']

function SubjectCard({ subject, index, onRemove }) {
  const color = COLORS[index % COLORS.length]
  const bg    = BGS[index % BGS.length]
  const initials = subject.name.slice(0, 2).toUpperCase()

  return (
    <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Icon */}
        <div style={{ width: 60, height: 60, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 18, color }}>
          {initials}
        </div>

        {/* Name + progress */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#1E1B4B', marginBottom: 2 }}>{subject.name}</div>
          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 10 }}>{subject.category}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 5 }}>0% Complete</div>
          <div style={{ background: '#E5E7EB', borderRadius: 10, height: 7, overflow: 'hidden', width: 160 }}>
            <div style={{ width: '0%', height: '100%', background: color, borderRadius: 10 }} />
          </div>
        </div>

        <div style={{ width: 1, height: 56, background: '#F0F0F4', flexShrink: 0 }} />

        {/* No session yet */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Next Session</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>No sessions scheduled yet</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => onRemove(subject.id)} style={{ padding: '8px 16px', border: '1px solid #FECACA', borderRadius: 9, background: '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Remove
          </button>
        </div>
      </div>

      {/* Bottom detail row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#FAFAFA', borderTop: '1px solid #F0F0F4' }}>
        {['Upcoming Assignments', 'Next Session', 'Resources'].map((section, i) => (
          <div key={section} style={{ padding: '16px 20px', borderRight: i < 2 ? '1px solid #F0F0F4' : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>{section}</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>None yet</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────────── */

export default function MySubjectsPage() {
  const user = getUser()
  const [subjects,      setSubjects]      = useState([])
  const [showAddModal,  setShowAddModal]  = useState(false)

  const handleAdd    = (data) => setSubjects(p => [...p, { ...data, id: Date.now() }])
  const handleRemove = (id)  => setSubjects(p => p.filter(s => s.id !== id))

  const firstName = user?.name?.split(' ')[0] || 'Student'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ms-wrap * { box-sizing: border-box; }
        .ms-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .ms-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .ms-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .ms-add-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #7C3AED; color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .15s; }
        .ms-add-btn:hover { background: #6D28D9; }
      `}</style>

      <div className="ms-wrap">
        <div className="ms-main">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>My Subjects</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage your subjects, assignments, and study materials all in one place.</p>
            </div>
            <button className="ms-add-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add Subject
            </button>
          </div>

          {subjects.length === 0 ? (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BookOpen size={24} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 8 }}>No subjects added yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Add your subjects to track your progress and upcoming sessions.</div>
              <button className="ms-add-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={15} /> Add Your First Subject
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subjects.map((s, i) => (
                <SubjectCard key={s.id} subject={s} index={i} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="ms-right">

          {/* Overall Study Progress */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 16 }}>Overall Study Progress</div>
            <DonutChart />
          </div>

          {/* Upcoming Sessions */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Upcoming Sessions</span>
            </div>
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No upcoming sessions</div>
            </div>
            <button style={{ width: '100%', marginTop: 8, padding: '10px', background: 'transparent', border: '1px solid #E5E7EB', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              View All Sessions
            </button>
          </div>

          {/* Motivational card */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={20} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>Keep it up, {firstName}!</div>
                <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.5 }}>Add your subjects and start tracking your progress to achieve your goals!</div>
              </div>
            </div>
            <button style={{ width: '100%', padding: '10px', background: '#F3F0FF', border: 'none', borderRadius: 10, color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              View Achievements
            </button>
          </div>
        </div>
      </div>

      {showAddModal && <AddSubjectModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
    </>
  )
}
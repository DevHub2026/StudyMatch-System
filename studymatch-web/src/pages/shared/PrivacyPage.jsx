import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Lock, Users, BookOpen, Calendar, MessageSquare,
  UserCheck, Shield, Download, Trash2, ChevronRight,
  ChevronDown, HelpCircle,
} from 'lucide-react'

/* ─── data ──────────────────────────────────────────────────── */

const VISIBILITY_OPTIONS = ['Everyone', 'Study Partners', 'Only Me']

const PRIVACY_TOGGLES = [
  {
    id: 'online_status',
    icon: Users,
    label: 'Show Online Status',
    desc: "Allow others to see when you're online.",
    defaultOn: true,
  },
  {
    id: 'show_subjects',
    icon: BookOpen,
    label: 'Show My Subjects',
    desc: "Allow others to see the subjects you're studying.",
    defaultOn: true,
  },
  {
    id: 'show_schedule',
    icon: Calendar,
    label: 'Show My Schedule',
    desc: 'Allow others to see your upcoming study sessions.',
    defaultOn: false,
  },
  {
    id: 'allow_messages',
    icon: MessageSquare,
    label: 'Allow Messages',
    desc: 'Let other users send you messages.',
    defaultOn: true,
  },
  {
    id: 'allow_tutor_requests',
    icon: UserCheck,
    label: 'Allow Tutor Requests',
    desc: 'Let other users send you tutor requests.',
    defaultOn: true,
  },
]

const WHO_CAN_SEE = [
  { label: 'Profile Information', value: 'Everyone' },
  { label: 'Online Status',       value: 'Everyone' },
  { label: 'Subjects',            value: 'Everyone' },
  { label: 'Schedule',            value: 'Only Me'  },
  { label: 'Messages',            value: 'Everyone' },
  { label: 'Tutor Requests',      value: 'Everyone' },
]

const DATA_ROWS = [
  {
    id: 'usage',
    icon: Shield,
    color: '#7C3AED',
    bg: '#F3F0FF',
    label: 'Data Usage',
    desc: 'Learn how we collect, use, and protect your data.',
  },
  {
    id: 'download',
    icon: Download,
    color: '#6366F1',
    bg: '#EEF2FF',
    label: 'Download My Data',
    desc: 'Request a copy of your data.',
  },
  {
    id: 'delete',
    icon: Trash2,
    color: '#EF4444',
    bg: '#FEF2F2',
    label: 'Delete My Data',
    desc: 'Permanently delete your data from our systems.',
  },
]

/* ─── helpers ───────────────────────────────────────────────── */

function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? '#7C3AED' : '#D1D5DB',
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'white', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

function SelectDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', background: 'white',
          border: '1px solid #E5E7EB', borderRadius: 10,
          cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
          color: '#374151', userSelect: 'none', minWidth: 160,
        }}
      >
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown
          size={14} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }}
        />
      </div>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: '110%', right: 0,
            background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
            zIndex: 50, minWidth: '100%', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  padding: '10px 16px', fontSize: 13.5,
                  color: opt === value ? '#7C3AED' : '#374151',
                  fontWeight: opt === value ? 600 : 400,
                  cursor: 'pointer',
                  background: opt === value ? '#F3F0FF' : 'white',
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#F8F9FB' }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'white' }}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────── */

export default function PrivacyPage() {
  const [visibility, setVisibility] = useState(() => localStorage.getItem('prv_visibility') || 'Everyone')
  const [toggles, setToggles] = useState(() => {
    try {
      const stored = localStorage.getItem('prv_toggles')
      return stored ? JSON.parse(stored) : Object.fromEntries(PRIVACY_TOGGLES.map(t => [t.id, t.defaultOn]))
    } catch { return Object.fromEntries(PRIVACY_TOGGLES.map(t => [t.id, t.defaultOn])) }
  })

  useEffect(() => { localStorage.setItem('prv_visibility', visibility) }, [visibility])
  useEffect(() => { localStorage.setItem('prv_toggles',    JSON.stringify(toggles)) }, [toggles])

  const toggle = id => setToggles(p => ({ ...p, [id]: !p[id] }))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .prv-wrap * { box-sizing: border-box; }
        .prv-wrap {
          font-family: 'DM Sans', sans-serif;
          color: #1E1B4B;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .prv-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        .prv-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .setting-row {
          display: flex; align-items: center; gap: 18;
          padding: 18px 24px; border-bottom: 1px solid #F8F9FB;
          transition: background .12s;
        }
        .setting-row:last-child { border-bottom: none; }
        .setting-row:hover { background: #FAFAFA; }
        .data-row {
          display: flex; align-items: center; gap: 18px;
          padding: 18px 24px; border-bottom: 1px solid #F8F9FB;
          cursor: pointer; transition: background .12s;
        }
        .data-row:last-child { border-bottom: none; }
        .data-row:hover { background: #FAFAFA; }
        .who-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid #F8F9FB; font-size: 13.5px;
        }
        .who-row:last-child { border-bottom: none; }
      `}</style>

      <div className="prv-wrap">
        <div className="prv-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Privacy</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              Control your privacy and manage how your information is used.
            </p>
          </div>

          {/* ── Privacy Settings ── */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 14 }}>
              Privacy Settings
            </div>
            <div style={{
              background: 'white', border: '1px solid #F0F0F4',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Profile Visibility — dropdown row */}
              <div className="setting-row" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 24px', borderBottom: '1px solid #F8F9FB' }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: '#F3F0FF', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Lock size={20} color="#7C3AED" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>
                    Profile Visibility
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    Choose who can view your profile.
                  </div>
                </div>
                <SelectDropdown
                  value={visibility}
                  options={VISIBILITY_OPTIONS}
                  onChange={setVisibility}
                />
              </div>

              {/* Toggle rows */}
              {PRIVACY_TOGGLES.map(({ id, icon: Icon, label, desc }) => (
                <div
                  key={id}
                  className="setting-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 24px', borderBottom: '1px solid #F8F9FB' }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 13,
                    background: '#F3F0FF', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={20} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>{desc}</div>
                  </div>
                  <Toggle on={toggles[id]} onClick={() => toggle(id)} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Data & Activity ── */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 14 }}>
              Data & Activity
            </div>
            <div style={{
              background: 'white', border: '1px solid #F0F0F4',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {DATA_ROWS.map(r => (
                <div key={r.id} className="data-row">
                  <div style={{
                    width: 46, height: 46, borderRadius: 13,
                    background: r.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <r.icon size={20} color={r.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>{r.desc}</div>
                  </div>
                  <ChevronRight size={16} color="#D1D5DB" />
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{
              padding: '11px 28px', background: '#7C3AED',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="prv-right">

          {/* Your Privacy Matters */}
          <div style={{
            background: 'white', border: '1px solid #F0F0F4',
            borderRadius: 16, padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#F3F0FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Lock size={20} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>
                Your Privacy Matters
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 14 }}>
              We're committed to protecting your personal information and giving you control over your privacy.
            </div>
            <button style={{
              background: 'none', border: 'none', color: '#7C3AED',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Learn more about our Privacy Policy <ChevronRight size={14} />
            </button>
          </div>

          {/* Who Can See What */}
          <div style={{
            background: 'white', border: '1px solid #F0F0F4',
            borderRadius: 16, padding: '20px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>
              Who Can See What?
            </div>
            <div>
              {WHO_CAN_SEE.map(({ label, value }) => (
                <div key={label} className="who-row">
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
                  <span style={{
                    fontSize: 12.5, fontWeight: 700,
                    color: value === 'Only Me' ? '#EF4444' : '#7C3AED',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 12, lineHeight: 1.5 }}>
              Manage settings to customize your privacy preferences.
            </div>
            <button style={{
              background: 'none', border: 'none', color: '#7C3AED',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: '10px 0 0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Review Settings <ChevronRight size={14} />
            </button>
          </div>

          {/* Need Help */}
          <div style={{
            background: 'white', border: '1px solid #F0F0F4',
            borderRadius: 16, padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#F3F0FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <HelpCircle size={20} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Need Help?</div>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 14 }}>
              Need help with your privacy settings? We're here to help.
            </div>
            <button style={{
              background: 'none', border: 'none', color: '#7C3AED',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Visit Help Center <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
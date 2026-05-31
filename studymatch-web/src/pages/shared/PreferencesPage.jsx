import { useState, useEffect } from 'react'
import {
  Users, Video, Clock, Heart, MessageSquare,
  Bell, ChevronDown, CheckCircle, HelpCircle,
  ChevronRight,
} from 'lucide-react'

/* ─── options ───────────────────────────────────────────────── */

const SUBJECT_OPTIONS     = ['Mathematics, Physics, Computer Science', 'Mathematics only', 'Physics only', 'Computer Science only', 'All Subjects']
const LEVEL_OPTIONS       = ['College', 'High School', 'Graduate', 'Professional']
const GOAL_OPTIONS        = ['Understand Concepts, Exam Prep', 'Exam Prep only', 'Skill Building', 'Project Help']
const MATCH_BASED_OPTIONS = ['Subject Expertise', 'Availability', 'Teaching Style', 'Rating']
const SESSION_TYPE_OPTIONS= ['Online or In-Person', 'Online only', 'In-Person only']
const AVAILABILITY_OPTIONS= ['Evenings & Weekends', 'Weekdays', 'Mornings', 'Anytime']
const COMM_OPTIONS        = ['In-App Messaging', 'Email', 'Both']

/* ─── helpers ───────────────────────────────────────────────── */

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? '#7C3AED' : '#D1D5DB',
      position: 'relative', cursor: 'pointer',
      transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: 'white',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

function Dropdown({ value, options, onChange, fullWidth = false }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', background: 'white',
        border: '1px solid #E5E7EB', borderRadius: 10,
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
        color: '#374151', userSelect: 'none',
        width: fullWidth ? '100%' : 'auto',
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={13} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s', flexShrink: 0 }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0,
            background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
            zIndex: 50, minWidth: '100%', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }} style={{
                padding: '9px 14px', fontSize: 13,
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

function SectionBlock({ title, desc, children }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #F0F0F4',
      borderRadius: 16, padding: '22px 24px',
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>{desc}</div>
      </div>
      {children}
    </div>
  )
}

function PrefCol({ icon: Icon, label, desc, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: '#F3F0FF', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color="#7C3AED" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>{label}</div>
          <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────── */

const ls = (key, def) => { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def } catch { return def } }

export default function PreferencesPage() {
  // Study Preferences
  const [subjects, setSubjects]     = useState(() => ls('prf_subjects',   SUBJECT_OPTIONS[0]))
  const [level, setLevel]           = useState(() => ls('prf_level',      'College'))
  const [goals, setGoals]           = useState(() => ls('prf_goals',      GOAL_OPTIONS[0]))

  // Matching Preferences
  const [matchBased, setMatchBased] = useState(() => ls('prf_matchBased',   'Subject Expertise'))
  const [sessionType, setSessionType] = useState(() => ls('prf_sessionType','Online or In-Person'))
  const [availability, setAvailability] = useState(() => ls('prf_avail',   'Evenings & Weekends'))
  const [groupSessions, setGroupSessions] = useState(() => ls('prf_groupSessions', true))

  // Communication Preferences
  const [comm, setComm]             = useState(() => ls('prf_comm',             'In-App Messaging'))
  const [sessionReminders, setSessionReminders] = useState(() => ls('prf_sessionReminders', true))
  const [msgNotifs, setMsgNotifs]   = useState(() => ls('prf_msgNotifs',  true))


  useEffect(() => { localStorage.setItem('prf_subjects',          JSON.stringify(subjects))         }, [subjects])
  useEffect(() => { localStorage.setItem('prf_level',             JSON.stringify(level))            }, [level])
  useEffect(() => { localStorage.setItem('prf_goals',             JSON.stringify(goals))            }, [goals])
  useEffect(() => { localStorage.setItem('prf_matchBased',        JSON.stringify(matchBased))       }, [matchBased])
  useEffect(() => { localStorage.setItem('prf_sessionType',       JSON.stringify(sessionType))      }, [sessionType])
  useEffect(() => { localStorage.setItem('prf_avail',             JSON.stringify(availability))     }, [availability])
  useEffect(() => { localStorage.setItem('prf_groupSessions',     JSON.stringify(groupSessions))    }, [groupSessions])
  useEffect(() => { localStorage.setItem('prf_comm',              JSON.stringify(comm))             }, [comm])
  useEffect(() => { localStorage.setItem('prf_sessionReminders',  JSON.stringify(sessionReminders)) }, [sessionReminders])
  useEffect(() => { localStorage.setItem('prf_msgNotifs',         JSON.stringify(msgNotifs))        }, [msgNotifs])

  const MATCH_SUMMARY = [
    { label: 'Subject Expertise', value: matchBased === 'Subject Expertise' ? 'High Importance' : 'Normal' },
    { label: 'Academic Level',    value: level },
    { label: 'Session Type',      value: sessionType },
    { label: 'Availability',      value: availability },
    { label: 'Group Sessions',    value: groupSessions ? 'Enabled' : 'Disabled' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .pref-wrap * { box-sizing: border-box; }
        .pref-wrap {
          font-family: 'DM Sans', sans-serif;
          color: #1E1B4B;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .pref-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .pref-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .match-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid #F8F9FB; font-size: 13px;
        }
        .match-row:last-child { border-bottom: none; }
      `}</style>

      <div className="pref-wrap">
        <div className="pref-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Preferences</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              Customize your experience and find the best matches for your study needs.
            </p>
          </div>

          {/* ── Study Preferences ── */}
          <SectionBlock
            title="Study Preferences"
            desc="Tell us what and how you like to learn."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                  Subjects of Interest
                </div>
                <Dropdown value={subjects} options={SUBJECT_OPTIONS} onChange={setSubjects} fullWidth />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                  Academic Level
                </div>
                <Dropdown value={level} options={LEVEL_OPTIONS} onChange={setLevel} fullWidth />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                  Learning Goals
                </div>
                <Dropdown value={goals} options={GOAL_OPTIONS} onChange={setGoals} fullWidth />
              </div>
            </div>
          </SectionBlock>

          {/* ── Matching Preferences ── */}
          <SectionBlock
            title="Matching Preferences"
            desc="Set your preferences for finding the right tutors and study partners."
          >
            {/* 3-col dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 20 }}>
              <PrefCol icon={Users} label="Match based on" desc="What's most important in a match for you.">
                <Dropdown value={matchBased} options={MATCH_BASED_OPTIONS} onChange={setMatchBased} fullWidth />
              </PrefCol>
              <PrefCol icon={Video} label="Preferred Session Type" desc="Choose your preferred session type.">
                <Dropdown value={sessionType} options={SESSION_TYPE_OPTIONS} onChange={setSessionType} fullWidth />
              </PrefCol>
              <PrefCol icon={Clock} label="Availability Preference" desc="When do you usually want to study?">
                <Dropdown value={availability} options={AVAILABILITY_OPTIONS} onChange={setAvailability} fullWidth />
              </PrefCol>
            </div>

            {/* Open to Group Sessions toggle row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', background: '#F8F9FB',
              borderRadius: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: '#F3F0FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Heart size={15} color="#7C3AED" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>Open to Group Sessions</div>
                <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>Show me group study sessions and partners.</div>
              </div>
              <Toggle on={groupSessions} onClick={() => setGroupSessions(p => !p)} />
            </div>
          </SectionBlock>

          {/* ── Communication Preferences ── */}
          <SectionBlock
            title="Communication Preferences"
            desc="Choose how you want to communicate."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {/* Preferred Communication — dropdown */}
              <PrefCol icon={MessageSquare} label="Preferred Communication" desc="Choose your preferred contact method.">
                <Dropdown value={comm} options={COMM_OPTIONS} onChange={setComm} fullWidth />
              </PrefCol>

              {/* Session Reminders — toggle */}
              <PrefCol icon={Bell} label="Session Reminders" desc="Receive reminders before sessions.">
                <div style={{ paddingTop: 6 }}>
                  <Toggle on={sessionReminders} onClick={() => setSessionReminders(p => !p)} />
                </div>
              </PrefCol>

              {/* Message Notifications — toggle */}
              <PrefCol icon={MessageSquare} label="Message Notifications" desc="Get notified about new messages.">
                <div style={{ paddingTop: 6 }}>
                  <Toggle on={msgNotifs} onClick={() => setMsgNotifs(p => !p)} />
                </div>
              </PrefCol>
            </div>
          </SectionBlock>

          {/* Save */}
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
              Save Preferences
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="pref-right">

          {/* Your Preferences */}
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
                <Users size={20} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Your Preferences</div>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 14 }}>
              These preferences help us personalize your StudyMatch experience.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                'Better matches',
                'Personalized recommendations',
                'Relevant study opportunities',
                'Improved learning experience',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                  <CheckCircle size={15} color="#10B981" fill="#F0FDF4" />
                  {item}
                </div>
              ))}
            </div>
            <button style={{
              background: 'none', border: 'none', color: '#7C3AED',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Learn how matching works <ChevronRight size={14} />
            </button>
          </div>

          {/* Match Preferences summary */}
          <div style={{
            background: 'white', border: '1px solid #F0F0F4',
            borderRadius: 16, padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#F3F0FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Users size={20} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Match Preferences</div>
                <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 3, lineHeight: 1.5 }}>
                  You'll be matched with tutors and students who fit your preferences.
                </div>
              </div>
            </div>

            <div>
              {MATCH_SUMMARY.map(({ label, value }) => (
                <div key={label} className="match-row">
                  <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                  <span style={{
                    fontWeight: 700, fontSize: 12.5,
                    color: value === 'High Importance' || value === 'Enabled' ? '#7C3AED' : '#6B7280',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <button style={{
              background: 'none', border: 'none', color: '#7C3AED',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: '12px 0 0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Edit Matching Preferences <ChevronRight size={14} />
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
              Not sure what to choose? We're here to help you find the best settings.
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
import { useState, useEffect } from 'react'
import { getProfile, updateProfile } from '../../api/profile'
import { getUser, saveAuth, getToken } from '../../store/authStore'
import {
  Camera, Pencil, Mail, Phone, Calendar, GraduationCap,
  Heart, Globe, Star, BookOpen, CheckCircle, Loader2, Save, X,
} from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────── */

function Avatar({ name = '', color = '#7C3AED', size = 90 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
      border: '3px solid #DDD6FE',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.3, color: '#7C3AED',
    }}>
      {initials}
    </div>
  )
}

const TABS = ['Profile', 'Edit Profile', 'Preferences']

/* ─── main page ───────────────────────────────────────────── */

export default function StudentProfilePage() {
  const authUser = getUser()
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [activeTab, setActiveTab] = useState('Profile')

  // Edit form state
  const [form, setForm] = useState({
    name: '', bio: '', phone: '', course: '',
    year_level: '', study_style: '', study_goals: '',
    preferred_days: '', preferred_time: '',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res  = await getProfile()
        const data = res?.data || res || {}
        setProfile(data)
        setForm({
          name:          data.name          || authUser?.name || '',
          bio:           data.bio           || '',
          phone:         data.phone         || '',
          course:        data.course        || '',
          year_level:    data.year_level    || '',
          study_style:   data.study_style   || '',
          study_goals:   data.study_goals   || '',
          preferred_days:data.preferred_days|| '',
          preferred_time:data.preferred_time|| '',
        })
      } catch {
        setError('Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await updateProfile(form)
      const updated = res?.data || res || {}
      setProfile(p => ({ ...p, ...updated, ...form }))
      // Update authStore
      saveAuth(getToken(), { ...authUser, name: form.name })
      setSuccess('Profile updated successfully!')
      setActiveTab('Profile')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const name    = profile?.name    || authUser?.name    || 'Student'
  const email   = profile?.email   || authUser?.email   || ''
  const phone   = profile?.phone   || ''
  const course  = profile?.course  || ''
  const year    = profile?.year_level || ''
  const bio     = profile?.bio     || ''
  const style   = profile?.study_style || ''
  const goals   = profile?.study_goals || ''
  const prefDays= profile?.preferred_days || ''
  const prefTime= profile?.preferred_time || ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .pp-wrap * { box-sizing: border-box; }
        .pp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .pp-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .pp-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .pp-tab { padding: 9px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; }
        .pp-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .pp-tab:hover { color: #7C3AED; }
        .pp-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; color: #374151; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .pp-input:focus { border-color: #7C3AED; }
        .pp-label { font-size: 12.5px; font-weight: 600; color: #6B7280; display: block; margin-bottom: 6px; }
        .info-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; }
        .info-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pp-wrap">
        <div className="pp-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>My Profile</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage your profile and study preferences.</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #F0F0F4' }}>
            {TABS.map(t => (
              <button key={t} className={`pp-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error   && <div style={{ padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13.5, color: '#EF4444' }}>{error}</div>}
          {success && <div style={{ padding: '10px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 13.5, color: '#10B981', display: 'flex', alignItems: 'center', gap: 7 }}><CheckCircle size={15} /> {success}</div>}

          {/* ── Profile Tab ── */}
          {activeTab === 'Profile' && (
            <>
              {/* Hero card */}
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={name} size={90} />
                    <button onClick={() => setActiveTab('Edit Profile')} style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#7C3AED', border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <Camera size={13} color="white" />
                    </button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontWeight: 800, fontSize: 22, color: '#1E1B4B' }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 20, padding: '3px 10px' }}>
                        Student
                      </span>
                    </div>
                    {email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#6B7280', marginBottom: 4 }}>
                        <Mail size={13} color="#9CA3AF" /> {email}
                      </div>
                    )}
                    {phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#6B7280', marginBottom: 4 }}>
                        <Phone size={13} color="#9CA3AF" /> {phone}
                      </div>
                    )}
                    {memberSince && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF' }}>
                        <Calendar size={13} color="#9CA3AF" /> Member since {memberSince}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setActiveTab('Edit Profile')} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: 'white', border: '1.5px solid #E5E7EB',
                    borderRadius: 9, color: '#374151', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, borderTop: '1px solid #F0F0F4', paddingTop: 20 }}>
                  {[
                    { label: 'Overall Progress', value: '—',    color: '#7C3AED' },
                    { label: 'Sessions Attended', value: profile?.sessions_count || 0,  color: '#10B981' },
                    { label: 'Study Hours',        value: profile?.study_hours    || 0,  color: '#6366F1' },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid #F0F0F4' : 'none', padding: '0 16px' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Education */}
                <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={15} color="#7C3AED" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Education</span>
                  </div>
                  {[
                    { label: 'Course',     value: course  || '—' },
                    { label: 'Year Level', value: year    || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="info-row">
                      <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Study Preferences */}
                <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={15} color="#10B981" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Study Preferences</span>
                  </div>
                  {[
                    { label: 'Study Style',     value: style    || '—' },
                    { label: 'Study Goals',     value: goals    || '—' },
                    { label: 'Preferred Days',  value: prefDays || '—' },
                    { label: 'Preferred Time',  value: prefTime || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="info-row">
                      <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>About Me</div>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{bio}</p>
                </div>
              )}
            </>
          )}

          {/* ── Edit Profile Tab ── */}
          {activeTab === 'Edit Profile' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'name',           label: 'Full Name',      type: 'text'  },
                  { key: 'phone',          label: 'Phone Number',   type: 'text'  },
                  { key: 'course',         label: 'Course',         type: 'text'  },
                  { key: 'year_level',     label: 'Year Level',     type: 'text'  },
                  { key: 'study_style',    label: 'Study Style',    type: 'text'  },
                  { key: 'preferred_days', label: 'Preferred Days', type: 'text'  },
                  { key: 'preferred_time', label: 'Preferred Time', type: 'text'  },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="pp-label">{label}</label>
                    <input
                      className="pp-input" type={type}
                      value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={label}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="pp-label">Study Goals</label>
                  <input className="pp-input" value={form.study_goals} onChange={e => setForm(p => ({ ...p, study_goals: e.target.value }))} placeholder="Your study goals..." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="pp-label">Bio</label>
                  <textarea
                    className="pp-input" rows={4}
                    value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleSave} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '11px 22px', background: '#7C3AED', color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setActiveTab('Profile')} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '11px 22px', background: 'white', color: '#374151',
                  border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Preferences Tab ── */}
          {activeTab === 'Preferences' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '24px 28px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Study Preferences</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'study_style',    label: 'Study Style'    },
                  { key: 'preferred_days', label: 'Preferred Days' },
                  { key: 'preferred_time', label: 'Preferred Time' },
                  { key: 'study_goals',    label: 'Study Goals'    },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="pp-label">{label}</label>
                    <input className="pp-input" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={label} />
                  </div>
                ))}
              </div>
              <button onClick={handleSave} disabled={saving} style={{
                marginTop: 20, display: 'flex', alignItems: 'center', gap: 6,
                padding: '11px 22px', background: '#7C3AED', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="pp-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Account Info</div>
            {[
              { icon: Mail,  label: 'Email',  value: email  || '—' },
              { icon: Phone, label: 'Phone',  value: phone  || '—' },
              { icon: GraduationCap, label: 'Course', value: course || '—' },
              { icon: Calendar, label: 'Year',  value: year   || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F8F9FB' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color="#7C3AED" />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1B4B' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
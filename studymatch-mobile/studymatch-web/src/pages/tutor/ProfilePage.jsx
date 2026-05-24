import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProfile, updateProfile } from '../../api/profile'
import { getUser, saveAuth, getToken } from '../../store/authStore'
import {
  MapPin, Star, BadgeCheck, Camera, Pencil,
  GraduationCap, Heart, Calendar, Globe,
  ChevronRight, ChevronLeft, Trophy, CheckCircle,
  BookOpen, Code2, FlaskConical, BarChart2,
  Clock, Eye, Users, ArrowRight, Shield, Loader2, Save,
} from 'lucide-react'

const PROFILE_TABS = ['Profile', 'Subjects & Expertise', 'Availability', 'Preferences', 'Account']

const ABOUT_KEYS = [
  { icon: GraduationCap, label: 'Education',      key: 'education',      color: '#7C3AED', bg: '#F3F0FF', placeholder: 'e.g. B.S. in Mathematics, UCLA' },
  { icon: Heart,         label: 'Teaching Style', key: 'teaching_style', color: '#EC4899', bg: '#FDF2F8', placeholder: 'e.g. Conceptual, Practice-based' },
  { icon: Calendar,      label: 'Experience',     key: 'experience',     color: '#6366F1', bg: '#EEF2FF', placeholder: 'e.g. 2+ years tutoring' },
  { icon: Globe,         label: 'Languages',      key: 'languages',      color: '#10B981', bg: '#F0FDF4', placeholder: 'e.g. English (Native)' },
]

const ACHIEVEMENTS = [
  { icon: Trophy,      color: '#F59E0B', bg: '#FFFBEB', label: 'Top Tutor',    sub: '100+ sessions'    },
  { icon: CheckCircle, color: '#10B981', bg: '#F0FDF4', label: 'Verified',     sub: 'Identity verified' },
  { icon: Star,        color: '#7C3AED', bg: '#F3F0FF', label: 'Highly Rated', sub: '4.5+ average'     },
]

function Stars({ rating = 0, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} color="#F59E0B" fill={i <= Math.round(rating) ? '#F59E0B' : 'none'} />
      ))}
    </div>
  )
}

export default function TutorProfilePage() {
  const authUser = getUser()
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [activeTab, setActiveTab] = useState('Profile')
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    name: '', bio: '', phone: '', education: '',
    teaching_style: '', experience: '', languages: '',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res  = await getProfile()
        const data = res?.data || res || {}
        setProfile(data)
        setForm({
          name:           data.name           || authUser?.name || '',
          bio:            data.bio            || '',
          phone:          data.phone          || '',
          education:      data.education      || '',
          teaching_style: data.teaching_style || '',
          experience:     data.experience     || '',
          languages:      data.languages      || '',
        })
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      await updateProfile(form)
      setProfile(p => ({ ...p, ...form }))
      saveAuth(getToken(), { ...authUser, name: form.name })
      setSuccess('Profile updated!'); setActiveTab('Profile')
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Failed to update profile.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const name     = profile?.name     || authUser?.name || 'Tutor'
  const email    = profile?.email    || authUser?.email || ''
  const bio      = profile?.bio      || ''
  const rating   = parseFloat(profile?.average_rating  || profile?.rating || 0)
  const sessions = profile?.sessions_count || profile?.total_sessions || 0
  const students = profile?.students_count || profile?.students_helped || 0
  const subjects = profile?.subjects?.length || 0
  const reviews  = profile?.reviews || []
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tp-wrap * { box-sizing: border-box; }
        .tp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .tp-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .tp-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .tp-tab { padding: 9px 2px; font-size: 13.5px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; white-space: nowrap; }
        .tp-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .tp-tab:hover { color: #7C3AED; }
        .about-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; }
        .about-row:last-child { border-bottom: none; }
        .tp-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; color: #374151; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .tp-input:focus { border-color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tp-wrap">
        <div className="tp-main">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>My Profile</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage your profile, subjects, availability, and tutoring preferences.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F0F4' }}>
            <div style={{ display: 'flex', gap: 24, flex: 1, overflowX: 'auto' }}>
              {PROFILE_TABS.map(t => <button key={t} className={`tp-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingBottom: 2 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 9, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Eye size={14} color="#7C3AED" /> Preview
              </button>
              <button onClick={() => setActiveTab('Profile')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
              >
                <Pencil size={13} /> Edit Profile
              </button>
            </div>
          </div>

          {success && <div style={{ padding: '10px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 13.5, color: '#10B981', display: 'flex', alignItems: 'center', gap: 7 }}><CheckCircle size={14} /> {success}</div>}
          {error   && <div style={{ padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13.5, color: '#EF4444' }}>{error}</div>}

          {/* Profile hero */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', border: '3px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, color: '#7C3AED' }}>
                  {initials}
                </div>
                <button style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: '#7C3AED', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={12} color="white" />
                </button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, fontSize: 22, color: '#1E1B4B' }}>{name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 20, padding: '3px 10px' }}>
                    <BadgeCheck size={13} color="#7C3AED" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>Verified Tutor</span>
                  </div>
                </div>
                {email && <div style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 6 }}>{email}</div>}
                {rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Stars rating={rating} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{rating.toFixed(1)}</span>
                    {reviews.length > 0 && <span style={{ fontSize: 12, color: '#9CA3AF' }}>({reviews.length} reviews)</span>}
                  </div>
                )}
                {bio && <div style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, fontStyle: 'italic', maxWidth: 400 }}>{bio}</div>}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid #F0F0F4', paddingTop: 20 }}>
              {[
                { icon: Star,     color: '#F59E0B', bg: '#FFFBEB', label: 'Student Rating',  value: rating > 0 ? rating.toFixed(1) : '—' },
                { icon: Calendar, color: '#7C3AED', bg: '#F3F0FF', label: 'Total Sessions',  value: sessions },
                { icon: BookOpen, color: '#6366F1', bg: '#EEF2FF', label: 'Subjects',        value: subjects  },
                { icon: Users,    color: '#10B981', bg: '#F0FDF4', label: 'Students Helped', value: students  },
              ].map(({ icon: Icon, color, bg, label, value }, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: i === 0 ? '0 24px 0 0' : i === 3 ? '0 0 0 24px' : '0 24px', borderRight: i < 3 ? '1px solid #F0F0F4' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About Me */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>About Me</span>
              <button onClick={() => setActiveTab('Profile')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Pencil size={12} /> Edit
              </button>
            </div>
            {ABOUT_KEYS.map(({ icon: Icon, label, key, color, bg }) => (
              <div key={key} className="about-row">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: profile?.[key] ? '#374151' : '#D1D5DB', fontWeight: 500 }}>
                    {profile?.[key] || 'Not set'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 16 }}>Recent Reviews</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviews.slice(0, 3).map((r, i) => {
                  const reviewer = r.reviewer?.name || r.student?.name || r.user?.name || 'Student'
                  return (
                    <div key={i} style={{ background: '#F8F9FB', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>{reviewer}</span>
                        <Stars rating={r.rating || 5} size={12} />
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0 }}>{r.comment}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Edit form */}
          {activeTab !== 'Profile' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '24px 28px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Edit Profile</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[{ key: 'name', label: 'Full Name' }, { key: 'phone', label: 'Phone' }].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input className="tp-input" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={label} />
                  </div>
                ))}
                {ABOUT_KEYS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input className="tp-input" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Bio</label>
                  <textarea className="tp-input" rows={4} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell students about yourself..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="tp-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 16 }}>Achievements</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {ACHIEVEMENTS.map(({ icon: Icon, color, bg, label, sub }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: bg, border: `2px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Icon size={24} color={color} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: 16, padding: '20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Trophy size={20} color="white" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 8 }}>Build Your Reputation</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 16 }}>Keep your profile updated to attract more students.</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', color: '#7C3AED', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              View Tips <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
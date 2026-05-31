import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser } from '../../store/authStore'
import { sendMatchRequest, getMatchRequests } from '../../api/matchRequests'
import axiosInstance from '../../api/axiosInstance'
import {
  ArrowLeft, UserPlus, Star, BookOpen, Calendar,
  MapPin, Phone, Mail, Loader2, Shield,
} from 'lucide-react'

const COLORS = ['#7C3AED','#10B981','#6366F1','#F59E0B','#EC4899','#EF4444']
const getColor    = id => COLORS[(Number(id) || 0) % COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

function parseBio(raw) {
  if (!raw) return null
  if (typeof raw !== 'string') return String(raw)
  if (!raw.trim().startsWith('{')) return raw
  try {
    const obj = JSON.parse(raw)
    const parts = []
    if (obj.department)  parts.push(obj.department)
    if (obj.education)   parts.push(obj.education)
    if (obj.experience)  parts.push(`${obj.experience} experience`)
    if (obj.teaching_mode) parts.push(`Teaching mode: ${obj.teaching_mode}`)
    if (Array.isArray(obj.grade_levels) && obj.grade_levels.length)
      parts.push(`Grade levels: ${obj.grade_levels.join(', ')}`)
    if (obj.from_time && obj.to_time) parts.push(`Available ${obj.from_time} – ${obj.to_time}`)
    return parts.length ? parts.join(' · ') : null
  } catch {
    return raw
  }
}

function Avatar({ name = '', color = '#7C3AED', avatarUrl = null, size = 80 }) {
  if (avatarUrl) {
    const full = avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${avatarUrl}`
    return (
      <img src={full} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${color}44`, flexShrink: 0 }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `3px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.3, color, flexShrink: 0, fontFamily: 'inherit',
    }}>
      {getInitials(name)}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F8F9FB', fontSize: 13.5 }}>
      <Icon size={15} color="#7C3AED" style={{ flexShrink: 0 }} />
      <span style={{ color: '#9CA3AF', fontWeight: 500, minWidth: 90 }}>{label}</span>
      <span style={{ color: '#1E1B4B', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function UserProfileViewPage() {
  const { userId } = useParams()
  const navigate   = useNavigate()
  const me         = getUser()
  const isTutor    = me?.role === 'tutor'

  const [profile,    setProfile]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [requested,  setRequested]  = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('')
      try {
        const res = await axiosInstance.get(`/users/${userId}/profile`)
        setProfile(res.data?.user || res.data)
      } catch {
        setError('Failed to load profile. The user may not exist or their profile is private.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  useEffect(() => {
    getMatchRequests().then(res => {
      const list = res?.data?.data || res?.data || []
      ;(Array.isArray(list) ? list : []).forEach(r => {
        if (String(r.id) === String(userId)) setRequested(true)
      })
    }).catch(() => {})
  }, [userId])

  const handleRequest = async () => {
    if (requested || requesting) return
    setRequesting(true)
    try {
      await sendMatchRequest(userId)
      setRequested(true)
    } catch {}
    finally { setRequesting(false) }
  }

  const color = getColor(userId)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .uvp-wrap * { box-sizing: border-box; }
        .uvp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; max-width: 820px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="uvp-wrap">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
            <Loader2 size={32} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', marginBottom: 6 }}>Profile Unavailable</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>{error}</div>
          </div>
        ) : profile ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Left card */}
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 220, width: 220 }}>
              <Avatar name={profile.name || ''} color={color} avatarUrl={profile.avatar} size={88} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#1E1B4B', marginBottom: 4 }}>{profile.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', background: '#F3F0FF', borderRadius: 20, padding: '3px 12px', display: 'inline-block', textTransform: 'capitalize' }}>
                  {profile.role || 'User'}
                </div>
              </div>

              {profile.role === 'tutor' && profile.tutor?.verification_status === 'approved' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                  <Shield size={13} /> Verified Tutor
                </div>
              )}

              {profile.role === 'tutor' && profile.tutor?.average_rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} color="#F59E0B" fill={i <= Math.round(profile.tutor.average_rating) ? '#F59E0B' : 'none'} />
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginLeft: 2 }}>
                    {parseFloat(profile.tutor.average_rating).toFixed(1)}
                  </span>
                </div>
              )}

              {String(userId) !== String(me?.id) && (
                <button
                  onClick={handleRequest}
                  disabled={requested || requesting}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '11px', background: requested ? '#F3F0FF' : '#7C3AED',
                    color: requested ? '#7C3AED' : 'white',
                    border: requested ? '1.5px solid #DDD6FE' : 'none',
                    borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                    cursor: (requested || requesting) ? 'default' : 'pointer', fontFamily: 'inherit',
                    opacity: requesting ? 0.7 : 1,
                  }}
                >
                  {requesting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                  {requested ? 'Request Sent' : requesting ? 'Sending…' : 'Send Request'}
                </button>
              )}
            </div>

            {/* Right details */}
            <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* About */}
              {(() => {
                const rawBio = profile.bio || profile.tutor?.bio || profile.student?.bio
                const bio    = parseBio(rawBio)
                if (!bio) return null
                return (
                  <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 10 }}>About</div>
                    <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.65, margin: 0 }}>{bio}</p>
                  </div>
                )
              })()}

              {/* Contact / basic info */}
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 10 }}>Details</div>
                <InfoRow icon={Mail}   label="Email"    value={profile.email} />
                <InfoRow icon={Phone}  label="Phone"    value={profile.phone} />
                {profile.role === 'tutor' && (
                  <>
                    <InfoRow icon={MapPin}   label="Position"     value={profile.tutor?.position} />
                    <InfoRow icon={Calendar} label="Total Sessions" value={profile.tutor?.total_sessions?.toString()} />
                    <InfoRow icon={BookOpen} label="Specialization" value={profile.tutor?.specialization} />
                  </>
                )}
                {profile.role === 'student' && (
                  <>
                    <InfoRow icon={BookOpen} label="Program"    value={profile.student?.program} />
                    <InfoRow icon={Calendar} label="Year Level" value={profile.student?.year_level ? `${profile.student.year_level} Year` : ''} />
                  </>
                )}
              </div>

              {/* Subjects */}
              {(() => {
                const subs = profile.role === 'tutor'
                  ? (profile.tutor?.strong_subjects || profile.tutor?.tutor_subjects || []).map(ts => ts.subject?.name || ts.name || '').filter(Boolean)
                  : (profile.student?.weak_subjects || profile.student?.student_weak_subjects || []).map(ws => ws.subject?.name || ws.name || '').filter(Boolean)
                if (subs.length === 0) return null
                return (
                  <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 12 }}>
                      {profile.role === 'tutor' ? 'Subjects Taught' : 'Subjects Needing Help'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {subs.map((s, i) => (
                        <span key={i} style={{ padding: '5px 14px', borderRadius: 20, background: '#F3F0FF', color: '#7C3AED', fontSize: 13, fontWeight: 600, border: '1px solid #DDD6FE' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

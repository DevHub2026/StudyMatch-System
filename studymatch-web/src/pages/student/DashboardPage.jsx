import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUser } from '../../store/authStore'
import * as matchRequestsApi from '../../api/matchRequests'
import { getPendingRequests } from '../../api/matchRequests'
import * as notificationsApi from '../../api/notifications'
import { getSessions } from '../../api/sessions'
import { getConversations } from '../../api/chat'
import { isUpcomingTabSession, formatSessionDate, effectiveStatus, STATUS_STYLES } from '../../utils/sessionUtils'
import logo from '../../assets/logo.png'

import {
  Users, GitPullRequest, Clock, Flame,
  ArrowRight, Zap, Calendar, MessageSquare,
} from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────── */

const SESSION_COLORS = ['#7C3AED', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#EF4444']
const MSG_COLORS = SESSION_COLORS

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts)
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function normalizeConversations(res) {
  const raw = res?.conversations ?? res?.data ?? (Array.isArray(res) ? res : [])
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw
    .map(c => ({
      partner_id: c.other_user?.id || c.partner_id || c.id,
      partner_name: c.other_user?.name || c.partner_name || c.name || 'User',
      last_message: typeof c.last_message === 'string'
        ? c.last_message
        : c.latestMessage?.content || c.last_message?.content || '',
      last_message_at: c.last_message_at || c.latestMessage?.created_at || c.updated_at,
      unread_count: c.unread_count || 0,
    }))
    .filter(c => {
      const key = String(c.partner_id)
      if (!c.partner_id || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
}

function sessionInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function Avatar({ initials = '?', color = '#7C3AED', size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, color,
      flexShrink: 0, fontFamily: 'inherit',
    }}>
      {initials}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #F0F0F4',
      borderRadius: 14, padding: 20, ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, linkTo, linkLabel = 'View all' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{title}</span>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

const EmptyState = ({ icon: Icon, title, sub, actionLabel, actionTo }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '28px 20px', textAlign: 'center',
    background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: '#EEF2FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED',
    }}>
      <Icon size={20} />
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{title}</div>
    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</div>
    {actionLabel && actionTo && (
      <Link to={actionTo} style={{
        marginTop: 4, padding: '8px 18px', borderRadius: 8,
        border: '1.5px solid #7C3AED', color: '#7C3AED',
        fontSize: 12, fontWeight: 600, textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        {actionLabel} <ArrowRight size={13} />
      </Link>
    )}
  </div>
)

function RecentMessagesList({ conversations, compact = false, limit = 5 }) {
  const list = conversations.slice(0, limit)

  if (list.length === 0) {
    if (compact) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={18} color="#7C3AED" />
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>No messages yet</div>
        </div>
      )
    }
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        sub="Start a conversation with a study partner."
        actionLabel="Go to Messages"
        actionTo="/student/messages"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 12 }}>
      {list.map((c, i) => {
        const id = c.partner_id || i
        const name = c.partner_name
        const color = MSG_COLORS[(id || 0) % MSG_COLORS.length]
        const preview = c.last_message || 'No messages yet'
        return (
          <Link
            key={id}
            to={`/student/messages?partner=${id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: compact ? '8px 0' : '12px 14px',
              borderRadius: compact ? 0 : 12,
              border: compact ? 'none' : '1px solid #F0F0F4',
              borderBottom: compact ? '1px solid #F8F9FB' : undefined,
              textDecoration: 'none', color: 'inherit',
              transition: 'background .12s',
            }}
            onMouseEnter={e => { if (!compact) e.currentTarget.style.background = '#FAFAFA' }}
            onMouseLeave={e => { if (!compact) e.currentTarget.style.background = 'transparent' }}
          >
            <Avatar initials={sessionInitials(name)} color={color} size={compact ? 36 : 44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                <span style={{
                  fontWeight: 700, fontSize: compact ? 13 : 14, color: '#1E1B4B',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {name}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                  {timeAgo(c.last_message_at)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 12, color: '#9CA3AF',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {preview}
                </span>
                {c.unread_count > 0 && (
                  <span style={{
                    background: '#7C3AED', color: 'white', borderRadius: '50%',
                    minWidth: 18, height: 18, fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', flexShrink: 0,
                  }}>
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ─── dashboard UI ─────────────────────────────────────────── */

function StudentDashboard({
  user, stats, upcomingSessions = [], recentMessages = [],
}) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => ({ label, active: false }))
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'S'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .db-wrap * { box-sizing: border-box; }
        .db-wrap {
          font-family: 'DM Sans', sans-serif; color: #1E1B4B;
          display: flex; gap: 24px;
        }
        .db-main  { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .db-right { width: 288px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .db-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .db-stat-card {
          background: white; border: 1px solid #F0F0F4; border-radius: 14px;
          padding: 16px 14px; min-height: 88px;
          display: flex; align-items: center; gap: 12px;
          text-decoration: none; color: #1E1B4B; transition: box-shadow .18s, transform .18s;
          overflow: hidden;
        }
        .db-stat-card:hover { box-shadow: 0 4px 18px rgba(124,58,237,.10); transform: translateY(-1px); }
        .db-stat-card > div:last-child { min-width: 0; flex: 1; }
        .db-stat-card > div:last-child > div:first-child { font-size: clamp(20px, 4vw, 26px); }
        .db-stat-card > div:last-child > div:nth-child(2),
        .db-stat-card > div:last-child > div:nth-child(3) {
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        @media (max-width: 900px) {
          .db-wrap { flex-direction: column; }
          .db-right { width: 100%; }
          .db-stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .db-stat-grid { grid-template-columns: 1fr; }
          .db-hero { padding: 22px 20px; }
          .db-hero h2 { font-size: 22px; }
        }
        .db-hero {
          background: linear-gradient(135deg, #2b1464, #12052c);
          border-radius: 18px; padding: 28px 32px; color: white;
        }
        .db-find-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #7C3AED; color: white; padding: 11px 22px;
          border-radius: 10px; font-size: 14px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: background .15s;
        }
        .db-find-btn:hover { background: #6D28D9; }
        .db-outline-btn {
          width: 100%; margin-top: 14px; padding: 10px;
          background: transparent; color: #7C3AED;
          border: 1.5px solid #7C3AED; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background .15s;
        }
        .db-outline-btn:hover { background: #F3F0FF; }
      `}</style>

      <div className="db-wrap">
        {/* ── Main column ── */}
        <div className="db-main">

          {/* Greeting */}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              Good morning, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 400 }}>
              Let's keep learning and achieve your goals.
            </p>
          </div>

          {/* Hero */}
          <div className="db-hero">
            {/* StudyMatch logo in hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src={logo} alt="StudyMatch" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontWeight: 800, fontSize: 18, color: 'white' }}>
                Study<span style={{ color: '#A78BFA' }}>Match</span>
              </span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
              Find your perfect{' '}
              <span style={{ color: '#A78BFA' }}>study partner</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20, fontSize: 14 }}>
              Connect, learn and achieve your goals together.
            </p>
            <Link to="/student/find-tutors" className="db-find-btn">
              Find Matches <ArrowRight size={14} />
            </Link>
          </div>

          {/* Stats */}
          <div className="db-stat-grid">
            {[
              { icon: Users,         color: '#10B981', value: stats.activeMatches,       label: 'Active Matches',    sub: 'View matches →',  to: '/student/find-tutors'    },
              { icon: GitPullRequest, color: '#F59E0B', value: stats.pendingRequests,    label: 'Pending Requests',  sub: 'View requests →', to: '/student/find-tutors'    },
              { icon: Clock,         color: '#7C3AED', value: stats.upcomingSessions,    label: 'Upcoming Sessions', sub: 'View sessions →', to: '/student/study-sessions' },
              { icon: Flame,         color: '#EF4444', value: stats.unreadNotifications, label: 'Notifications',     sub: 'View all →',      to: '/student/notifications'  },
            ].map(({ icon: Icon, color, value, label, sub, to }) => (
              <Link key={label} to={to} className="db-stat-card">
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 500, marginTop: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 1 }}>{sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Upcoming sessions */}
          <Card>
            <SectionHeader title="Upcoming Sessions" linkTo="/student/study-sessions" />
            {upcomingSessions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming sessions"
                sub="Connect with a study partner to schedule your first session."
                actionLabel="Find Partners"
                actionTo="/student/find-tutors"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingSessions.slice(0, 5).map((s, i) => {
                  const tutorName = s.tutor?.user?.name || 'Tutor'
                  const color = SESSION_COLORS[i % SESSION_COLORS.length]
                  const statusKey = effectiveStatus(s)
                  const badge = STATUS_STYLES[statusKey] || STATUS_STYLES.pending
                  return (
                    <Link
                      key={s.id}
                      to="/student/study-sessions"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12,
                        border: '1px solid #F0F0F4', textDecoration: 'none', color: 'inherit',
                        transition: 'background .12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <Avatar initials={sessionInitials(tutorName)} color={color} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>
                          {s.subject?.name || 'Study Session'}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }}>
                          with {tutorName}
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {formatSessionDate(s.scheduled_at)}
                          {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, flexShrink: 0,
                        background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                      }}>
                        {badge.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Recent messages */}
          <Card>
            <SectionHeader title="Recent Messages" linkTo="/student/messages" />
            <RecentMessagesList conversations={recentMessages} limit={5} />
          </Card>
        </div>

        {/* ── Right panel ── */}
        <div className="db-right">

          {/* User card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={initials} color="#7C3AED" size={48} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name || 'Student'}</div>
                <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textTransform: 'capitalize', marginTop: 2 }}>
                  {user?.role || 'student'}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 16, textAlign: 'center' }}>
              {[
                { label: 'Sessions',     value: stats.upcomingSessions },
                { label: 'Study Buddies', value: stats.activeMatches   },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#F8F9FB', borderRadius: 10, padding: '10px 6px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1E1B4B' }}>{value}</div>
                  <div style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Study Streak */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Study Streak</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Flame size={26} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: 34, fontWeight: 800, color: '#1E1B4B' }}>0</span>
              <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>days in a row</span>
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Keep it up! Consistency is key.</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {weekDays.map((d, i) => (
                <div key={d.date || i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: d.active ? '#EDE9FE' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                  }}>
                    <Zap size={11} color={d.active ? '#7C3AED' : '#D1D5DB'} />
                  </div>
                  <div style={{ fontSize: 9.5, color: '#9CA3AF', marginTop: 4 }}>{d.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Messages */}
          <Card>
            <SectionHeader title="Recent Messages" linkTo="/student/messages" />
            <RecentMessagesList conversations={recentMessages} compact limit={4} />
          </Card>
        </div>
      </div>
    </>
  )
}

/* ─── page wrapper ─────────────────────────────────────────── */

export default function DashboardPage() {
  const user = getUser()

  const [stats, setStats] = useState({
    activeMatches: 0, pendingRequests: 0,
    upcomingSessions: 0, unreadNotifications: 0,
  })
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
      try {
        const [matchRes, pendingRes] = await Promise.allSettled([
          matchRequestsApi.getMatchRequests(),
          getPendingRequests(),
        ])
        const active  = matchRes.status === 'fulfilled'  ? (matchRes.value?.data?.data?.length  || matchRes.value?.data?.length  || 0) : 0
        const pending = pendingRes.status === 'fulfilled' ? (pendingRes.value?.data?.data?.length || pendingRes.value?.data?.length || 0) : 0
        setStats(prev => ({ ...prev, activeMatches: active, pendingRequests: pending }))
      } catch {}

      try {
        const notifData = await notificationsApi.getNotifications()
        const list  = notifData?.data || []
        const unread = Array.isArray(list) ? list.filter(n => !n.is_read).length : 0
        setStats(prev => ({ ...prev, unreadNotifications: unread }))
      } catch {}

      try {
        const sessionsRes = await getSessions()
        const sessionsList = Array.isArray(sessionsRes?.data) ? sessionsRes.data : []
        const now = new Date()
        const upcoming = sessionsList.filter(s => isUpcomingTabSession(s, now))
        setUpcomingSessions(upcoming)
        setStats(prev => ({ ...prev, upcomingSessions: upcoming.length }))
      } catch {
        setUpcomingSessions([])
      }

      try {
        const convRes = await getConversations()
        setRecentMessages(normalizeConversations(convRes))
      } catch {
        setRecentMessages([])
      }

      setLoading(false)
  }

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(() => {
      getSessions()
        .then(sessionsRes => {
          const sessionsList = Array.isArray(sessionsRes?.data) ? sessionsRes.data : []
          const now = new Date()
          const upcoming = sessionsList.filter(s => isUpcomingTabSession(s, now))
          setUpcomingSessions(upcoming)
          setStats(prev => ({ ...prev, upcomingSessions: upcoming.length }))
        })
        .catch(() => {})
      getConversations()
        .then(convRes => setRecentMessages(normalizeConversations(convRes)))
        .catch(() => {})
      notificationsApi.getNotifications()
        .then(notifData => {
          const list = notifData?.data || []
          const unread = Array.isArray(list) ? list.filter(n => !n.is_read).length : 0
          setStats(prev => ({ ...prev, unreadNotifications: unread }))
        })
        .catch(() => {})
    }, 45000)
    const onFocus = () => fetchDashboard()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}>
        Loading...
      </div>
    )
  }

  return (
    <StudentDashboard
      user={user}
      stats={stats}
      upcomingSessions={upcomingSessions}
      recentMessages={recentMessages}
    />
  )
}
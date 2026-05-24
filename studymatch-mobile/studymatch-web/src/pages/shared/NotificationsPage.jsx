import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as notificationsApi from '../../api/notifications'
import {
  Bell, Megaphone, MessageSquare, Settings, Shield,
  Check, ChevronRight, ArrowRight, Moon, Mail,
  Calendar, Clock, UserCheck, Tag, ChevronDown,
} from 'lucide-react'

/* ─── helpers ───────────────────────────────────────────────── */

const formatTime = (ts) => {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ─── notification prefs ────────────────────────────────────── */

const PREFS = [
  { key: 'announcements',   label: 'Announcements',   sub: 'Important updates and news', icon: Megaphone, color: '#7C3AED', bg: '#F3F0FF' },
  { key: 'session_updates', label: 'Session Updates',  sub: 'Changes to your sessions',   icon: Calendar,  color: '#6366F1', bg: '#EEF2FF' },
  { key: 'messages',        label: 'Messages',         sub: 'New messages and replies',   icon: MessageSquare, color: '#10B981', bg: '#F0FDF4' },
  { key: 'matches',         label: 'Matches',          sub: 'New matches and requests',   icon: Shield,    color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'reminders',       label: 'Reminders',        sub: 'Session reminders and alerts', icon: Clock,   color: '#EC4899', bg: '#FDF2F8' },
  { key: 'system',          label: 'System Updates',   sub: 'Account and system updates', icon: Settings, color: '#6B7280', bg: '#F9FAFB' },
]

const TIME_OPTIONS   = ['9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM']
const END_OPTIONS    = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM']
const TZ_OPTIONS     = ['(GMT+8:00) Manila', '(GMT+0:00) UTC', '(GMT-5:00) EST', '(GMT-8:00) PST']
const FREQ_OPTIONS   = ['Daily', 'Weekly', 'Never']

/* ─── tiny shared components ────────────────────────────────── */

function Toggle({ on, onClick, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 20 : 24
  const dot = size === 'sm' ? 14 : 18
  return (
    <div onClick={onClick} style={{
      width: w, height: h, borderRadius: h / 2,
      background: on ? '#7C3AED' : '#D1D5DB',
      position: 'relative', cursor: 'pointer',
      transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: (h - dot) / 2,
        left: on ? w - dot - (h - dot) / 2 : (h - dot) / 2,
        width: dot, height: dot, borderRadius: '50%',
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
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: 'white',
        border: '1px solid #E5E7EB', borderRadius: 9,
        cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151',
        userSelect: 'none',
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0,
          background: 'white', border: '1px solid #E5E7EB',
          borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
          zIndex: 50, overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false) }} style={{
              padding: '9px 12px', fontSize: 13,
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
      )}
    </div>
  )
}

/* ─── notification icon map ─────────────────────────────────── */

const getIcon = (type) => {
  const map = {
    announcement: { Icon: Megaphone,     bg: '#F3F0FF', color: '#7C3AED' },
    match_request:{ Icon: Shield,         bg: '#F0FDF4', color: '#10B981' },
    message:      { Icon: MessageSquare,  bg: '#EEF2FF', color: '#6366F1' },
    session:      { Icon: Calendar,       bg: '#FFFBEB', color: '#F59E0B' },
    system:       { Icon: Settings,       bg: '#F9FAFB', color: '#6B7280' },
  }
  return map[type] || { Icon: Bell, bg: '#F3F0FF', color: '#7C3AED' }
}

/* ─── notification item ─────────────────────────────────────── */

function NotifItem({ notif, onMarkRead }) {
  const { Icon, bg, color } = getIcon(notif.type)
  return (
    <div
      onClick={() => !notif.is_read && onMarkRead(notif.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
        background: notif.is_read ? 'white' : '#FAFAFF',
        border: `1px solid ${notif.is_read ? '#F0F0F4' : '#DDD6FE'}`,
        transition: 'all .15s', position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,58,237,.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#7C3AED',
          position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
          flexShrink: 0,
        }} />
      )}

      <div style={{
        width: 42, height: 42, borderRadius: 12, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 3 }}>
          {notif.title}
          {notif.badge && (
            <span style={{
              marginLeft: 8, padding: '1px 8px', borderRadius: 20,
              fontSize: 10, fontWeight: 700, background: '#F3F0FF',
              color: '#7C3AED', border: '1px solid #DDD6FE',
            }}>
              {notif.badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: notif.action ? 8 : 0, lineHeight: 1.5 }}>
          {notif.message}
          {notif.sub && <span style={{ color: '#C4B5FD' }}> · {notif.sub}</span>}
        </div>
        {notif.action && (
          <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            {notif.action} <ArrowRight size={12} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{formatTime(notif.created_at)}</span>
        {!notif.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />}
        {notif.chevron && <ChevronRight size={14} color="#D1D5DB" />}
      </div>
    </div>
  )
}

/* ─── section block ─────────────────────────────────────────── */

function Section({ title, icon: Icon, iconBg, iconColor, subTitle, count, items, viewAllPath, onMarkRead, activeTab }) {
  const navigate = useNavigate()
  if (items.length === 0 && activeTab !== 'all') return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={iconColor} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 8 }}>
              {title}
              {count > 0 && (
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#7C3AED', color: 'white', fontSize: 10,
                  fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {count}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{subTitle}</div>
          </div>
        </div>
        <button
          onClick={() => navigate(viewAllPath || '/notifications')}
          style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          View all
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: '16px 18px', borderRadius: 12,
          background: '#F8F9FB', border: '1px dashed #DDD6FE',
          fontSize: 13, color: '#9CA3AF', textAlign: 'center',
        }}>
          No {title.toLowerCase()} notifications
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(n => <NotifItem key={n.id} notif={n} onMarkRead={onMarkRead} />)}
        </div>
      )}
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────── */

export default function NotificationsPage() {
  const navigate = useNavigate()

  // ── original state & logic preserved ──
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [prefs, setPrefs] = useState({
    announcements: true, session_updates: true,
    messages: true, matches: true, reminders: true, system: false,
  })

  // quiet hours & digest (new UI additions, no API yet)
  const [quietOn, setQuietOn]     = useState(true)
  const [startTime, setStartTime] = useState('10:00 PM')
  const [endTime, setEndTime]     = useState('7:00 AM')
  const [timezone, setTimezone]   = useState('(GMT+8:00) Manila')
  const [digestOn, setDigestOn]   = useState(true)
  const [frequency, setFrequency] = useState('Daily')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationsApi.getNotifications()
        setNotifications(data.data || [])
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── original handlers preserved ──
  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) { console.error(err) }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) { console.error(err) }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read
    return true
  })

  // ── original grouping preserved ──
  const announcements = filtered.filter(n => n.type === 'announcement')
  const activity      = filtered.filter(n => ['match_request', 'message', 'session'].includes(n.type))
  const system        = filtered.filter(n => n.type === 'system')
  const other         = filtered.filter(n => !['announcement', 'match_request', 'message', 'session', 'system'].includes(n.type))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .nf-wrap * { box-sizing: border-box; }
        .nf-wrap {
          font-family: 'DM Sans', sans-serif;
          color: #1E1B4B;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .nf-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .nf-right { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .nf-tab {
          padding: 9px 4px; font-size: 14px; font-weight: 600;
          color: #9CA3AF; cursor: pointer; border: none;
          border-bottom: 2.5px solid transparent; background: none;
          font-family: 'DM Sans', sans-serif; transition: color .15s;
          display: flex; align-items: center; gap: 7;
        }
        .nf-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .nf-tab:hover { color: #7C3AED; }
        .pref-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0; border-bottom: 1px solid #F8F9FB;
        }
        .pref-row:last-child { border-bottom: none; }
      `}</style>

      <div className="nf-wrap">
        <div className="nf-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Notifications</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage how and when you receive notifications.</p>
          </div>

          {/* Tabs + Mark all */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #F0F0F4', paddingBottom: 0,
          }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { key: 'all', label: 'All Notifications' },
                { key: 'unread', label: 'Unread', badge: unreadCount },
              ].map(t => (
                <button
                  key={t.key}
                  className={`nf-tab${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.badge > 0 && (
                    <span style={{
                      background: '#7C3AED', color: 'white', borderRadius: 10,
                      padding: '1px 6px', fontSize: 11, fontWeight: 700,
                    }}>{t.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#7C3AED',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                <Check size={14} /> Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{
              textAlign: 'center', color: '#9CA3AF',
              fontSize: 13, padding: 40,
            }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, padding: '48px 20px', textAlign: 'center',
              background: 'white', border: '1px dashed #DDD6FE', borderRadius: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: '#F3F0FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>🔕</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B' }}>No notifications yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                You're all caught up! New notifications will appear here.
              </div>
            </div>
          ) : (
            <>
              <Section
                title="Announcements"
                icon={Megaphone}
                iconBg="#F3F0FF" iconColor="#7C3AED"
                subTitle="Important updates and news from StudyMatch"
                count={announcements.filter(n => !n.is_read).length}
                items={announcements}
                viewAllPath="/announcements"
                onMarkRead={handleMarkAsRead}
                activeTab={activeTab}
              />
              <Section
                title="Activity"
                icon={MessageSquare}
                iconBg="#EEF2FF" iconColor="#6366F1"
                subTitle="Updates about your sessions and matches"
                count={activity.filter(n => !n.is_read).length}
                items={activity}
                onMarkRead={handleMarkAsRead}
                activeTab={activeTab}
              />
              <Section
                title="System"
                icon={Settings}
                iconBg="#F9FAFB" iconColor="#6B7280"
                subTitle="Account and system updates"
                count={system.filter(n => !n.is_read).length}
                items={system}
                onMarkRead={handleMarkAsRead}
                activeTab={activeTab}
              />
              {other.length > 0 && (
                <Section
                  title="Other"
                  icon={Bell}
                  iconBg="#FFFBEB" iconColor="#F59E0B"
                  subTitle="Other notifications"
                  count={other.filter(n => !n.is_read).length}
                  items={other}
                  onMarkRead={handleMarkAsRead}
                  activeTab={activeTab}
                />
              )}
            </>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="nf-right">

          {/* Quiet Hours */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Moon size={17} color="#6366F1" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Quiet Hours</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 14 }}>
              Pause non-urgent notifications during quiet hours.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Start Time</div>
                <SelectDropdown value={startTime} options={TIME_OPTIONS} onChange={setStartTime} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>End Time</div>
                <SelectDropdown value={endTime} options={END_OPTIONS} onChange={setEndTime} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Time Zone</div>
              <SelectDropdown value={timezone} options={TZ_OPTIONS} onChange={setTimezone} />
            </div>
            <div style={{
              background: '#F8F9FB', borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                You won't receive non-urgent push notifications during this time.
              </div>
              <Toggle on={quietOn} onClick={() => setQuietOn(p => !p)} size="sm" />
            </div>
          </div>

          {/* Email Digest */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={17} color="#7C3AED" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Email Digest</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 14 }}>
              Receive a summary of notifications.
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Frequency</div>
              <SelectDropdown value={frequency} options={FREQ_OPTIONS} onChange={setFrequency} />
            </div>
            <div style={{
              background: '#F8F9FB', borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>You'll receive your digest every evening.</div>
              <Toggle on={digestOn} onClick={() => setDigestOn(p => !p)} size="sm" />
            </div>
          </div>

          {/* Notification Preferences */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={17} color="#7C3AED" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Notification Preferences</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 14 }}>
              Choose what you want to be notified about.
            </div>
            <div>
              {PREFS.map(p => (
                <div key={p.key} className="pref-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <p.icon size={14} color={p.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{p.label}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{p.sub}</div>
                    </div>
                  </div>
                  <Toggle
                    on={prefs[p.key]}
                    onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <button style={{
              width: '100%', marginTop: 14, padding: '10px',
              background: '#7C3AED', color: 'white', border: 'none',
              borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
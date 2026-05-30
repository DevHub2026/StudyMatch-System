import { useEffect, useState } from 'react'
import api from '../api/axiosInstance'
import {
  Send, Bell, CheckCircle, AlertCircle, Info,
  AlertTriangle, XCircle, Users, GraduationCap,
  UserCheck, Search, X, Loader2, RefreshCw,
  MessageSquare, ChevronDown,
} from 'lucide-react'

const ADMIN_EMAIL = 'studymatch.admin@gmail.com'

// ── Type badge ────────────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => {
  const cfg = {
    info:    { cls: 'bg-blue-50 text-blue-600 border-blue-200',     icon: Info          },
    warning: { cls: 'bg-amber-50 text-amber-600 border-amber-200',  icon: AlertTriangle  },
    success: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle },
    error:   { cls: 'bg-red-50 text-red-600 border-red-200',        icon: XCircle        },
  }
  const { cls, icon: Icon } = cfg[type] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: Info }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={10} /> {type}
    </span>
  )
}

// ── Audience picker ───────────────────────────────────────────────────────────

const AUDIENCE_OPTS = [
  { val: 'all',      label: 'All Users',     icon: Users,        color: '#7C3AED', bg: '#F3F0FF' },
  { val: 'students', label: 'Students Only', icon: GraduationCap, color: '#3B82F6', bg: '#EFF6FF' },
  { val: 'tutors',   label: 'Tutors Only',   icon: UserCheck,    color: '#10B981', bg: '#F0FDF4' },
]

const AudiencePicker = ({ value, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
    {AUDIENCE_OPTS.map(({ val, label, icon: Icon, color, bg }) => (
      <button key={val} type="button" onClick={() => onChange(val)}
        style={{
          padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
          border: value === val ? `2px solid ${color}` : '1.5px solid #E5E7EB',
          background: value === val ? bg : '#FAFAFA',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          transition: 'all .15s', fontFamily: "'DM Sans', sans-serif",
        }}>
        <Icon size={17} color={value === val ? color : '#9CA3AF'} />
        <span style={{ fontSize: 12, fontWeight: 700, color: value === val ? color : '#6B7280' }}>
          {label}
        </span>
      </button>
    ))}
  </div>
)

const TYPE_OPTS = [
  { val: 'info',    label: 'Info',    color: '#3B82F6', bg: '#EFF6FF'  },
  { val: 'warning', label: 'Warning', color: '#D97706', bg: '#FFFBEB'  },
  { val: 'success', label: 'Success', color: '#059669', bg: '#F0FDF4'  },
  { val: 'error',   label: 'Urgent',  color: '#DC2626', bg: '#FEF2F2'  },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  // Admin inbox state
  const [notifications, setNotifications] = useState([])
  const [meta,          setMeta]          = useState(null)
  const [page,          setPage]          = useState(1)
  const [filter,        setFilter]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [marking,       setMarking]       = useState(false)

  // Sent messages tab
  const [activeTab,     setActiveTab]     = useState('compose') // 'compose' | 'inbox' | 'sent'
  const [sentMsgs,      setSentMsgs]      = useState([])
  const [sentLoading,   setSentLoading]   = useState(false)

  // Compose state
  const [form,          setForm]          = useState({
    title: '', message: '', type: 'info', target: 'all', user_id: null,
    specific_user: false,
  })
  const [userSearch,    setUserSearch]    = useState('')
  const [userResults,   setUserResults]   = useState([])
  const [searchingUser, setSearchingUser] = useState(false)
  const [selectedUser,  setSelectedUser]  = useState(null)
  const [sending,       setSending]       = useState(false)
  const [sendResult,    setSendResult]    = useState(null) // { count, message }
  const [composeError,  setComposeError]  = useState('')

  const [actionMsg,     setActionMsg]     = useState('')

  // ── Fetch admin inbox ──
  const fetchNotifications = async (p = page, f = filter) => {
    setLoading(true); setError('')
    try {
      const params = { page: p }
      if (f === 'unread') params.is_read = false
      if (f === 'read')   params.is_read = true
      const res = await api.get('/admin/notifications', { params })
      setNotifications(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch sent messages ──
  const fetchSent = async () => {
    setSentLoading(true)
    try {
      const res = await api.get('/admin/notifications/sent')
      setSentMsgs(res.data.data ?? [])
    } catch {}
    finally { setSentLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [page])
  useEffect(() => { if (activeTab === 'sent') fetchSent() }, [activeTab])

  const handleFilter = (val) => { setFilter(val); setPage(1); fetchNotifications(1, val) }

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`)
      fetchNotifications()
    } catch {}
  }

  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      await api.put('/admin/notifications/mark-all-read')
      setActionMsg('All notifications marked as read.')
      fetchNotifications()
    } catch { setActionMsg('Failed.') }
    finally { setMarking(false) }
  }

  // ── User search for "Specific User" target ──
  const searchUsers = async (q) => {
    if (q.length < 2) { setUserResults([]); return }
    setSearchingUser(true)
    try {
      const res = await api.get('/users/search', { params: { q } })
      setUserResults(res.data.users ?? [])
    } catch {}
    finally { setSearchingUser(false) }
  }

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300)
    return () => clearTimeout(t)
  }, [userSearch])

  // ── Send message ──
  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    if (form.specific_user && !selectedUser) return

    setSending(true); setComposeError(''); setSendResult(null)
    try {
      const payload = {
        title:   form.title.trim(),
        message: form.message.trim(),
        type:    form.type,
      }
      if (form.specific_user && selectedUser) {
        payload.user_id = selectedUser.id
      } else {
        payload.target = form.target
      }

      const res = await api.post('/admin/notifications/send', payload)
      setSendResult({ count: res.data.count, message: res.data.message })
      // Reset form after success
      setTimeout(() => {
        setSendResult(null)
        setForm({ title: '', message: '', type: 'info', target: 'all', user_id: null, specific_user: false })
        setSelectedUser(null); setUserSearch('')
      }, 3000)
    } catch (e) {
      setComposeError(e.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const formatDate  = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'
  const formatShort = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1E1B4B' }} className="space-y-0">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notification Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            Send direct messages to users and monitor platform notifications.
          </p>
        </div>
      </div>

      {/* Toast */}
      {actionMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          <CheckCircle size={14} /> {actionMsg}
          <button onClick={() => setActionMsg('')} className="ml-auto text-green-500 hover:text-green-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 mb-5">
        {[
          { key: 'compose', label: 'Compose Message', icon: Send  },
          { key: 'sent',    label: 'Sent',             icon: MessageSquare },
          { key: 'inbox',   label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === key ? 'text-indigo-600 border-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          COMPOSE TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-5 gap-6">

          {/* Compose panel */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Send size={16} color="#7C3AED" />
              </div>
              <div>
                <div className="font-bold text-gray-800">Send Message to Users</div>
                <div className="text-xs text-gray-400">Delivered to users' notification bell — they cannot reply</div>
              </div>
            </div>

            {sendResult ? (
              /* Success state */
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={30} color="#059669" />
                </div>
                <div className="text-lg font-bold text-gray-800 mb-2">Message Sent!</div>
                <div className="text-sm text-gray-500">{sendResult.message}</div>
                <div className="text-xs text-gray-400 mt-1">Resetting form…</div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">

                {/* Recipient toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Send To</label>
                  <div className="flex gap-2 mb-3">
                    {[
                      { val: false, label: 'Group / Broadcast' },
                      { val: true,  label: 'Specific User'     },
                    ].map(({ val, label }) => (
                      <button key={String(val)} type="button"
                        onClick={() => { setForm(p => ({ ...p, specific_user: val })); setSelectedUser(null); setUserSearch('') }}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          form.specific_user === val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {form.specific_user ? (
                    /* User search */
                    <div className="relative">
                      {selectedUser ? (
                        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                            {selectedUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 text-sm">{selectedUser.name}</div>
                            <div className="text-xs text-gray-500">{selectedUser.email}</div>
                          </div>
                          <button onClick={() => { setSelectedUser(null); setUserSearch('') }}
                            className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                              placeholder="Search user by name or email..."
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                            {searchingUser && (
                              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                            )}
                          </div>
                          {userResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                              {userResults.map(u => (
                                <button key={u.id} type="button"
                                  onClick={() => { setSelectedUser(u); setUserResults([]); setUserSearch('') }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800 text-sm">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email} · {u.role}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <AudiencePicker value={form.target} onChange={v => setForm(p => ({ ...p, target: v }))} />
                  )}
                </div>

                {/* Message type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message Type</label>
                  <div className="flex gap-2">
                    {TYPE_OPTS.map(({ val, label, color, bg }) => (
                      <button key={val} type="button" onClick={() => setForm(p => ({ ...p, type: val }))}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: 9, cursor: 'pointer',
                          border: form.type === val ? `2px solid ${color}` : '1.5px solid #E5E7EB',
                          background: form.type === val ? bg : '#FAFAFA',
                          fontSize: 12, fontWeight: 700,
                          color: form.type === val ? color : '#9CA3AF',
                          transition: 'all .15s', fontFamily: "'DM Sans', sans-serif",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Account update, Session reminder..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                </div>

                {/* Message body */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={5} placeholder="Write your message here..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" />
                  <div className="text-xs text-gray-400 mt-1 text-right">{form.message.length}/2000</div>
                </div>

                {composeError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                    <AlertCircle size={13} /> {composeError}
                  </div>
                )}

                <button onClick={handleSend}
                  disabled={sending || !form.title.trim() || !form.message.trim() || (form.specific_user && !selectedUser)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-lg transition-colors">
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : <><Send size={15} /> Send Message</>}
                </button>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="col-span-2 space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
              <div className="font-bold text-indigo-700 text-sm flex items-center gap-2">
                <Info size={15} /> How it works
              </div>
              <ul className="space-y-2 text-sm text-indigo-600">
                {[
                  'Message appears in the user\'s notification bell 🔔',
                  'Users can read it but cannot reply',
                  'The system includes a contact footer automatically',
                  'Broadcast reaches all active (non-suspended) users in the target group',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <Bell size={14} /> Message Preview
              </div>
              <div style={{
                background: '#F8F8FF', border: '1px solid #DDD6FE',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4B5563', marginBottom: 4 }}>
                  {form.title || <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>Subject goes here…</span>}
                </div>
                <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {form.message || <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>Message body goes here…</span>}
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E9D8FD', fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                  This is a message from StudyMatch Admin. For assistance, contact{' '}
                  <span style={{ color: '#7C3AED', fontWeight: 700 }}>{ADMIN_EMAIL}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#92400E', fontWeight: 700, marginBottom: 4 }}>
                <AlertTriangle size={13} color="#D97706" /> Note
              </div>
              <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
                Suspended users will not receive messages. Admins and super-admins are excluded from broadcasts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SENT TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Messages sent by admins via the notification system.</p>
            <button onClick={fetchSent} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {sentLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-indigo-400" /></div>
          ) : sentMsgs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400">
              <MessageSquare size={28} className="mx-auto mb-2 text-gray-300" />
              No messages sent yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Sent By</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Recipients</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sentMsgs.map((msg, i) => (
                    <tr key={msg.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-800">{msg.title}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{msg.message?.slice(0, 80)}…</div>
                      </td>
                      <td className="px-5 py-3.5"><TypeBadge type={msg.type} /></td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">{msg.data?.admin_name ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-indigo-600">{msg.recipient_count}</span>
                        <span className="text-gray-400 text-xs ml-1">user{msg.recipient_count !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{formatShort(msg.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          INBOX TAB — admin's own notifications
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {[{ val: '', label: 'All' }, { val: 'unread', label: 'Unread' }, { val: 'read', label: 'Read' }].map(f => (
                <button key={f.val} onClick={() => handleFilter(f.val)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
                    filter === f.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={marking}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <CheckCircle size={14} /> {marking ? 'Marking…' : 'Mark All Read'}
              </button>
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-indigo-400" /></div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-14 text-center text-gray-400">
              <Bell size={28} className="mx-auto mb-2 text-gray-300" />
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id}
                  className={`bg-white rounded-xl border shadow-sm px-5 py-4 flex items-start justify-between gap-4 transition-colors ${
                    !n.is_read ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'
                  }`}>
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                        <TypeBadge type={n.type} />
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">{formatDate(n.created_at)}</span>
                        {n.user && <span className="text-xs text-gray-400">· {n.user.name}</span>}
                      </div>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0">
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {meta.current_page} of {meta.last_page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Previous</button>
                <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

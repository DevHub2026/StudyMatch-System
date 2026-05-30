import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getConversations, getConversation, sendMessage, sendFile } from '../../api/chat'
import { getMatchRequests, cancelMatchRequest } from '../../api/matchRequests'
import { getAnnouncements } from '../../api/announcements'
import { getSessions, completeSession } from '../../api/sessions'
import { getUser } from '../../store/authStore'
import {
  Search, Video, Phone, MoreVertical, Paperclip,
  Image, FileText, Smile, Send, Users, MessageSquare,
  Share2, Megaphone, LayoutTemplate, ChevronRight,
  ChevronDown, ChevronUp,
  Loader2, Calendar, CheckSquare, UserMinus, X,
} from 'lucide-react'

const COLORS = ['#EC4899','#7C3AED','#10B981','#6366F1','#F59E0B','#EF4444']
const getColor    = (i) => COLORS[i % COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

const ANNOUNCEMENTS_ID = '__announcements__'

const MESSAGE_TEMPLATES = [
  "Hi! Ready to start our session? 👋",
  "I'll be a few minutes late, please wait.",
  "Let's review what we covered last time.",
  "Do you have any questions before we begin?",
  "Great session! See you next time. 🎉",
  "Please check the resource I just shared.",
]

const STATUS_COLORS = {
  scheduled: { bg: '#F0FDF4', color: '#10B981', label: 'Scheduled' },
  pending:   { bg: '#FEF9C3', color: '#CA8A04', label: 'Pending' },
  completed: { bg: '#F3F4F6', color: '#6B7280', label: 'Completed' },
  cancelled: { bg: '#FEF2F2', color: '#EF4444', label: 'Cancelled' },
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatSessionDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Avatar({ name = '', color = '#7C3AED', size = 42, online, isGroup }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: color + '22', border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.32, color, fontFamily: 'inherit' }}>
        {isGroup ? <Users size={size * 0.4} color={color} /> : getInitials(name)}
      </div>
      {online !== undefined && <div style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.25, height: size * 0.25, borderRadius: '50%', background: online ? '#22C55E' : '#D1D5DB', border: '2px solid white' }} />}
    </div>
  )
}

function buildMeetUrl(meId, partnerId, mode = 'video') {
  const a = Number(meId || 0)
  const b = Number(partnerId || 0)
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  const room = `studymatch-${min}-${max}`
  const base = `https://meet.jit.si/${encodeURIComponent(room)}`
  const config = mode === 'audio' ? 'config.startWithVideoMuted=true' : ''
  return config ? `${base}#${config}` : base
}

export default function TutorMessagesPage() {
  const me = getUser()
  const location = useLocation()
  const [convs,        setConvs]        = useState([])
  const [activeId,     setActiveId]     = useState(ANNOUNCEMENTS_ID)
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [search,       setSearch]       = useState('')
  const [activeTab,    setTab]          = useState('all')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [sending,      setSending]      = useState(false)
  const bottomRef    = useRef(null)
  const prevCountRef = useRef(0)
  const fileRef      = useRef(null)
  const searchRef    = useRef(null)
  const [showEmoji,   setShowEmoji]    = useState(false)
  const [sendingFile, setSendingFile]  = useState(false)

  // Announcements
  const [announcements, setAnnouncements] = useState([])
  const [expandedAnn,   setExpandedAnn]   = useState(null)
  const [annUnread,     setAnnUnread]     = useState(0)

  // 3-dot menu
  const [showMenu,        setShowMenu]        = useState(false)
  const [finishingSession, setFinishingSession] = useState(false)
  const [endingMatch,     setEndingMatch]     = useState(false)

  // Active sessions for current partner
  const [partnerSessions,  setPartnerSessions]  = useState([])
  const [loadingSessions,  setLoadingSessions]  = useState(false)

  // Message templates
  const [showTemplates, setShowTemplates] = useState(false)

  const EMOJIS = ['😀','😂','😊','❤️','👍','🙏','🔥','✨','🎉','😢','😮','🤔','👏','💪','🥳','😎','🤩','😅','🫡','💯']

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeId) return
    e.target.value = ''
    setSendingFile(true)
    const opt = { id: Date.now(), message_type: file.type.startsWith('image/') ? 'image' : 'file', file_path: URL.createObjectURL(file), file_name: file.name, sender_id: me?.id, created_at: new Date().toISOString(), is_mine: true }
    setMessages(p => [...p, opt])
    try { await sendFile(activeId, file) }
    catch { setMessages(p => p.filter(m => m.id !== opt.id)) }
    finally { setSendingFile(false) }
  }

  const openFilePicker = (accept) => {
    if (!activeId || activeId === ANNOUNCEMENTS_ID) return
    if (fileRef.current) { fileRef.current.accept = accept; fileRef.current.click() }
  }

  // Fetch sessions for current conversation partner
  const fetchPartnerSessions = async (partnerId) => {
    if (!partnerId || partnerId === ANNOUNCEMENTS_ID) { setPartnerSessions([]); return }
    setLoadingSessions(true)
    try {
      const res = await getSessions()
      const all = res?.data || res || []
      const filtered = (Array.isArray(all) ? all : [])
        .filter(s => String(s.studentUserId || s.student?.user?.id) === String(partnerId))
        .sort((a, b) => new Date(b.scheduled_at || b.scheduledAt) - new Date(a.scheduled_at || a.scheduledAt))
      setPartnerSessions(filtered)
    } catch {
      setPartnerSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }

  const activeSession = partnerSessions.find(s => s.status === 'scheduled') || partnerSessions.find(s => s.status === 'pending')

  const handleFinishSession = async (sessionId) => {
    const target = sessionId
      ? partnerSessions.find(s => String(s.id) === String(sessionId))
      : activeSession
    if (!target) return
    setFinishingSession(true)
    setShowMenu(false)
    try {
      await completeSession(target.id)
      await fetchPartnerSessions(activeId)
    } catch {}
    finally { setFinishingSession(false) }
  }

  const handleEndMatch = async () => {
    if (!activeId || activeId === ANNOUNCEMENTS_ID) return
    if (!window.confirm('End this match? The student will need to send a new request to work with you again.')) return
    setEndingMatch(true)
    setShowMenu(false)
    try {
      await cancelMatchRequest(activeId)
      setConvs(p => p.filter(c => (c.partner_id || c.id) !== activeId))
      setActiveId(ANNOUNCEMENTS_ID)
      setPartnerSessions([])
    } catch {}
    finally { setEndingMatch(false) }
  }

  useEffect(() => {
    const load = async () => {
      setLoadingConvs(true)
      try {
        const [convRes, reqRes, annRes] = await Promise.allSettled([
          getConversations(),
          getMatchRequests(),
          getAnnouncements(),
        ])

        if (annRes.status === 'fulfilled') {
          const annList = annRes.value?.data || annRes.value?.announcements || annRes.value || []
          const list = Array.isArray(annList) ? annList : []
          setAnnouncements(list)
          setAnnUnread(list.length > 0 ? 1 : 0)
        }

        const rawConvs = (convRes.status === 'fulfilled'
          ? (convRes.value?.data || convRes.value?.conversations || [])
          : []
        ).map(c => ({
          ...c,
          partner_id:      c.participantId    || c.other_user?.id   || c.partner_id,
          partner_name:    c.participantName  || c.other_user?.name  || c.partner_name || 'Unknown',
          last_message:    c.lastMessage      || c.latestMessage?.content || c.last_message || '',
          last_message_at: c.lastMessageTime  || c.latestMessage?.created_at || c.last_message_at,
          unread_count:    c.unreadCount      ?? c.unread_count ?? 0,
        }))

        const seenIds = new Set()
        const deduped = rawConvs.filter(c => {
          const key = String(c.partner_id)
          if (!c.partner_id || seenIds.has(key)) return false
          seenIds.add(key)
          return true
        })

        const matched = reqRes.status === 'fulfilled'
          ? (reqRes.value?.data?.data || reqRes.value?.data || [])
          : []
        for (const u of Array.isArray(matched) ? matched : []) {
          const uid = u.id
          if (uid && !seenIds.has(String(uid))) {
            seenIds.add(String(uid))
            deduped.push({
              partner_id:   uid,
              partner_name: u.fullName || u.name || 'Student',
              last_message: '',
              unread_count: 0,
            })
          }
        }

        setConvs(deduped)

        const params = new URLSearchParams(location.search)
        const partnerId = params.get('partner')
        if (partnerId) {
          setActiveId(Number(partnerId))
        }
      } catch {}
      finally { setLoadingConvs(false) }
    }
    load()
  }, [location.search])

  useEffect(() => {
    if (!activeId || activeId === ANNOUNCEMENTS_ID) return
    prevCountRef.current = 0
    setShowMenu(false)
    setShowTemplates(false)
    fetchPartnerSessions(activeId)

    const fetchMsgs = async (initial = false) => {
      if (initial) { setLoadingMsgs(true); setMessages([]) }
      try {
        const res = await getConversation(activeId)
        const msgs = res?.data || res?.messages?.data || res?.messages || []
        if (Array.isArray(msgs)) {
          setMessages(msgs.map(m => ({
            ...m,
            sender_id:    m.sender_id    ?? m.senderId,
            message_type: m.message_type ?? m.messageType,
            file_path:    m.file_path    ?? m.fileUrl,
            file_name:    m.file_name    ?? m.fileName,
            created_at:   m.created_at   ?? m.createdAt,
          })))
        }
      } catch {}
      finally { if (initial) setLoadingMsgs(false) }
    }

    fetchMsgs(true)
    const interval = setInterval(() => fetchMsgs(false), 5000)
    return () => clearInterval(interval)
  }, [activeId])

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCountRef.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeId || activeId === ANNOUNCEMENTS_ID || sending) return
    const text = input.trim(); setInput(''); setSending(true)
    const opt = { id: Date.now(), content: text, sender_id: me?.id, created_at: new Date().toISOString(), is_mine: true }
    setMessages(p => [...p, opt])
    try { await sendMessage(activeId, text) }
    catch { setMessages(p => p.filter(m => m.id !== opt.id)) }
    finally { setSending(false) }
  }

  const isAnnouncementsActive = activeId === ANNOUNCEMENTS_ID
  const totalUnread    = convs.reduce((s, c) => s + (c.unread_count || 0), 0)
  const activeConv     = convs.find(c => (c.partner_id || c.id) === activeId)
  const partnerName    = isAnnouncementsActive ? 'Announcements' : (activeConv?.partner_name || activeConv?.name || 'User')
  const partnerIdx     = convs.findIndex(c => (c.partner_id || c.id) === activeId)
  const partnerColor   = isAnnouncementsActive ? '#7C3AED' : getColor(partnerIdx >= 0 ? partnerIdx : 0)

  const startCall = (mode) => {
    if (!activeId || isAnnouncementsActive) return
    window.open(buildMeetUrl(me?.id, activeId, mode), '_blank', 'noopener,noreferrer')
  }

  const filtered = convs.filter(c => {
    if (activeTab === 'unread') return (c.unread_count || 0) > 0
    if (activeTab === 'groups') return c.is_group
    return true
  }).filter(c => !search || (c.partner_name || c.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tm-wrap * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        .tm-left { width: 270px; flex-shrink: 0; border: 1px solid #F0F0F4; display: flex; flex-direction: column; background: white; border-radius: 16px 0 0 16px; }
        .tm-center { flex: 1; display: flex; flex-direction: column; min-width: 0; background: white; border: 1px solid #F0F0F4; border-left: none; border-radius: 0 16px 16px 0; }
        .tm-right { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; padding-left: 20px; }
        .conv-row { display: flex; align-items: center; gap: 10px; padding: 11px 14px; cursor: pointer; border-radius: 10px; margin: 0 6px 2px; transition: background .12s; }
        .conv-row:hover { background: #F8F9FB; }
        .conv-row.active { background: #F3F0FF; }
        .t-tab { padding: 8px 4px; font-size: 13px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; }
        .t-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .msgs-area { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
        .msgs-area::-webkit-scrollbar { width: 3px; }
        .msgs-area::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
        .menu-item { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 8px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; width: 100%; text-align: left; transition: background .12s; }
        .menu-item:hover { background: #F8F9FB; }
        .menu-item.danger:hover { background: #FEF2F2; color: #EF4444 !important; }
        .q-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; }
        .q-row:last-child { border-bottom: none; }
        .q-row:hover .q-lbl { color: #7C3AED; }
        .tpl-btn { display: block; width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px; border: none; background: none; cursor: pointer; font-size: 13px; color: #374151; font-family: 'DM Sans', sans-serif; transition: background .12s; }
        .tpl-btn:hover { background: #F3F0FF; color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tm-wrap" style={{ color: '#1E1B4B' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Messages</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Communicate with your students, share resources, and stay connected.</p>
        </div>

        <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 160px)', minHeight: 560 }}>
          {/* Left panel */}
          <div className="tm-left">
            <div style={{ padding: '14px 14px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 12px' }}>
                <Search size={13} color="#9CA3AF" />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#374151' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, padding: '0 14px', borderBottom: '1px solid #F0F0F4' }}>
              {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread', badge: totalUnread }, { key: 'groups', label: 'Groups' }].map(t => (
                <button key={t.key} className={`t-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                  {t.label}{t.badge > 0 && <span style={{ marginLeft: 4, background: '#7C3AED', color: 'white', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 800 }}>{t.badge}</span>}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {/* Pinned Announcements */}
              <div
                className={`conv-row${isAnnouncementsActive ? ' active' : ''}`}
                onClick={() => { setActiveId(ANNOUNCEMENTS_ID); setAnnUnread(0) }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#F3F0FF', border: '2px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Megaphone size={18} color="#7C3AED" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>Announcements</span>
                    {annUnread > 0 && <span style={{ background: '#7C3AED', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{annUnread}</span>}
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {announcements.length > 0 ? announcements[0]?.title || 'View announcements' : 'No announcements'}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: '#F0F0F4', margin: '4px 14px' }} />

              {loadingConvs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 size={22} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} /></div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No conversations yet.</div>
              ) : filtered.map((c, i) => {
                const id = c.partner_id || c.id
                const name = c.partner_name || c.name || 'User'
                const last = typeof (c.last_message || '') === 'string' ? c.last_message : c.last_message?.content || ''
                const unread = c.unread_count || 0
                return (
                  <div key={id} className={`conv-row${activeId === id ? ' active' : ''}`} onClick={() => { setActiveId(id); setConvs(p => p.map(x => (x.partner_id || x.id) === id ? { ...x, unread_count: 0 } : x)) }}>
                    <Avatar name={name} color={getColor(i)} size={42} online={c.is_online} isGroup={c.is_group} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{name}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{formatTime(c.last_message_at || c.updated_at)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{last || 'No messages yet'}</span>
                        {unread > 0 && <span style={{ background: '#7C3AED', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unread}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Center panel */}
          <div className="tm-center">
            {!activeId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>Select a conversation to start messaging</div>
            ) : isAnnouncementsActive ? (
              /* ── Announcements view ── */
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#F3F0FF', border: '2px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={19} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Announcements</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>Official updates from StudyMatch — read only</div>
                  </div>
                </div>

                <div className="msgs-area">
                  {announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>
                      <Megaphone size={28} color="#DDD6FE" style={{ display: 'block', margin: '0 auto 10px' }} />
                      No announcements yet.
                    </div>
                  ) : [...announcements].reverse().map(ann => {
                    const isLong     = (ann.content || '').length > 200
                    const isExpanded = expandedAnn === ann.id
                    const preview    = isLong && !isExpanded
                      ? (ann.content || '').slice(0, 200) + '…'
                      : (ann.content || '')
                    const postedAt   = ann.published_at || ann.created_at
                    return (
                      <div key={ann.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                          maxWidth: '85%', background: '#F8F8FF',
                          border: '1px solid #DDD6FE', borderRadius: '4px 16px 16px 16px',
                          padding: '12px 16px', fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.6,
                          boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                            <Megaphone size={13} color="#7C3AED" />
                            <span style={{ fontWeight: 800, fontSize: 13.5, color: '#7C3AED' }}>{ann.title}</span>
                            {ann.is_pinned && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44', borderRadius: 20, padding: '1px 7px' }}>Pinned</span>
                            )}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.65 }}>{preview}</div>
                          {isLong && (
                            <button onClick={() => setExpandedAnn(isExpanded ? null : ann.id)}
                              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontWeight: 700, fontSize: 12.5, fontFamily: 'inherit', padding: 0 }}>
                              {isExpanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> View full announcement</>}
                            </button>
                          )}
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9CA3AF' }}>
                            <span>StudyMatch</span>
                            <span>·</span>
                            <span>{postedAt ? new Date(postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                            <span style={{ marginLeft: 'auto', padding: '1px 8px', borderRadius: 20, background: '#F3F0FF', color: '#7C3AED', fontWeight: 700, fontSize: 10 }}>Read only</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F4', background: '#FAFAFA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 10 }}>
                    <Megaphone size={15} color="#7C3AED" />
                    <span style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                      Announcements are broadcast-only — you cannot reply here.
                      To contact support, email{' '}
                      <a href="mailto:studymatch.admin@gmail.com"
                        style={{ color: '#7C3AED', fontWeight: 700, fontStyle: 'normal', textDecoration: 'none' }}>
                        studymatch.admin@gmail.com
                      </a>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
                  <Avatar name={partnerName} color={partnerColor} size={42} online={activeConv?.is_online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{partnerName}</div>
                    {activeSession && (
                      <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                        ● Active session · {formatSessionDate(activeSession.scheduled_at || activeSession.scheduledAt)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" title="Video call" onClick={() => startCall('video')}
                      style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Video size={15} color="#6B7280" />
                    </button>
                    <button type="button" title="Audio call" onClick={() => startCall('audio')}
                      style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Phone size={15} color="#6B7280" />
                    </button>

                    {/* 3-dot menu */}
                    <div style={{ position: 'relative' }}>
                      <button type="button" title="More options" onClick={() => setShowMenu(p => !p)}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: showMenu ? '#F3F0FF' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <MoreVertical size={15} color={showMenu ? '#7C3AED' : '#6B7280'} />
                      </button>

                      {showMenu && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 100, minWidth: 200 }}>
                            <button
                              className="menu-item"
                              onClick={() => handleFinishSession()}
                              disabled={!activeSession || finishingSession}
                              style={{ color: activeSession ? '#10B981' : '#9CA3AF', opacity: (!activeSession || finishingSession) ? 0.6 : 1 }}
                            >
                              {finishingSession
                                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                : <CheckSquare size={15} />}
                              {finishingSession ? 'Finishing…' : activeSession ? 'Finish Session' : 'No Active Session'}
                            </button>
                            <div style={{ height: 1, background: '#F0F0F4', margin: '4px 0' }} />
                            <button
                              className="menu-item danger"
                              onClick={handleEndMatch}
                              disabled={endingMatch}
                              style={{ color: '#EF4444', opacity: endingMatch ? 0.6 : 1 }}
                            >
                              {endingMatch
                                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                : <UserMinus size={15} />}
                              {endingMatch ? 'Ending…' : 'End Match'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="msgs-area">
                  {loadingMsgs ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 size={22} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} /></div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 24 }}>No messages yet. Say hello! 👋</div>
                  ) : messages.map(m => {
                    if (m.message_type === 'system') {
                      const lines = (m.content || '').split('\n\n')
                      const heading = lines[0] || ''
                      const body    = lines.slice(1).join('\n\n')
                      return (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                          <div style={{ maxWidth: '80%', background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#4B5563', textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#7C3AED', fontSize: 12, marginBottom: 4 }}>📋 {heading}</div>
                            {body && <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{body}</div>}
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Support response — read only</div>
                          </div>
                        </div>
                      )
                    }
                    const isMine = m.is_mine || String(m.sender_id ?? m.senderId) === String(me?.id)
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 4 }}>
                        {!isMine && <Avatar name={partnerName} color={partnerColor} size={28} />}
                        <div style={{ maxWidth: '68%', background: isMine ? '#F3F0FF' : 'white', border: isMine ? '1px solid #DDD6FE' : '1px solid #F0F0F4', borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px', padding: m.message_type === 'image' ? 4 : '11px 14px', fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.5, overflow: 'hidden' }}>
                          {m.message_type === 'image' ? (
                            <img src={m.file_path} alt={m.file_name || 'image'} style={{ display: 'block', maxWidth: 260, maxHeight: 200, borderRadius: 10, objectFit: 'cover' }} />
                          ) : m.message_type === 'file' ? (
                            <a href={m.file_path} target="_blank" rel="noopener noreferrer" download={m.file_name} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>
                              <FileText size={16} />{m.file_name || 'Download File'}
                            </a>
                          ) : (m.content || m.message || m.text || '')}
                          {(m.message_type === 'image' || m.message_type === 'file') && m.content && (
                            <div style={{ padding: '4px 8px', fontSize: 12.5, color: '#6B7280' }}>{m.content}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatTime(m.created_at)}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F4', position: 'relative' }}>
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />

                  {/* Emoji picker */}
                  {showEmoji && (
                    <div style={{ position: 'absolute', bottom: 90, left: 16, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4, width: 220, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10 }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => { setInput(p => p + e); setShowEmoji(false) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 3, borderRadius: 6, lineHeight: 1 }}
                          onMouseEnter={ev => ev.currentTarget.style.background = '#F3F0FF'}
                          onMouseLeave={ev => ev.currentTarget.style.background = 'none'}
                        >{e}</button>
                      ))}
                    </div>
                  )}

                  {/* Template picker */}
                  {showTemplates && (
                    <div style={{ position: 'absolute', bottom: 90, right: 16, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, minWidth: 240 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 4px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>Message Templates</span>
                        <button onClick={() => setShowTemplates(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={13} color="#9CA3AF" /></button>
                      </div>
                      {MESSAGE_TEMPLATES.map(t => (
                        <button key={t} className="tpl-btn" onClick={() => { setInput(t); setShowTemplates(false) }}>{t}</button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                    <input placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#374151', background: 'transparent' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => openFilePicker('*/*')} title="Attach file" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Paperclip size={18} color="#9CA3AF" /></button>
                      <button onClick={() => openFilePicker('image/*')} title="Send image" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Image size={18} color="#9CA3AF" /></button>
                      <button onClick={() => openFilePicker('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')} title="Send document" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><FileText size={18} color="#9CA3AF" /></button>
                      <button onClick={() => setShowEmoji(p => !p)} title="Emoji" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Smile size={18} color={showEmoji ? '#7C3AED' : '#9CA3AF'} /></button>
                    </div>
                    <button onClick={handleSend} disabled={sending || sendingFile} style={{ width: 40, height: 40, borderRadius: 10, background: '#7C3AED', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(sending || sendingFile) ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="white" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right panel */}
          <div className="tm-right">
            {/* Active Sessions */}
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Active Sessions</div>
              {loadingSessions ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                  <Loader2 size={20} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : !activeConv || isAnnouncementsActive ? (
                <div style={{ padding: '12px 0', textAlign: 'center' }}>
                  <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>Select a conversation</div>
                </div>
              ) : partnerSessions.length === 0 ? (
                <div style={{ padding: '12px 0', textAlign: 'center' }}>
                  <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>No sessions with {partnerName}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {partnerSessions.slice(0, 3).map(s => {
                    const st = STATUS_COLORS[s.status] || STATUS_COLORS.pending
                    const isActive = s.status === 'scheduled' || s.status === 'pending'
                    return (
                      <div key={s.id} style={{ background: '#F8F9FB', borderRadius: 10, padding: '10px 12px', border: `1px solid ${isActive ? '#DDD6FE' : '#F0F0F4'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, borderRadius: 20, padding: '2px 8px' }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                          {formatSessionDate(s.scheduled_at || s.scheduledAt)}
                        </div>
                        {s.subject?.name && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.subject.name}</div>}
                        {isActive && (
                          <button
                            onClick={() => handleFinishSession(s.id)}
                            disabled={finishingSession}
                            style={{ marginTop: 8, width: '100%', padding: '6px', background: '#10B981', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', opacity: finishingSession ? 0.6 : 1 }}
                          >
                            {finishingSession ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckSquare size={12} />}
                            Finish Session
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 10 }}>Quick Actions</div>

              {/* Start a New Conversation */}
              <div className="q-row" onClick={() => { setActiveId(ANNOUNCEMENTS_ID); setSearch(''); setTimeout(() => searchRef.current?.focus(), 100) }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MessageSquare size={15} color="#7C3AED" /></div>
                <span className="q-lbl" style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: '#1E1B4B' }}>Start a New Conversation</span>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>

              {/* Share a Resource */}
              <div className="q-row" onClick={() => openFilePicker('*/*')} style={{ opacity: (!activeConv || isAnnouncementsActive) ? 0.5 : 1, cursor: (!activeConv || isAnnouncementsActive) ? 'default' : 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Share2 size={15} color="#6366F1" /></div>
                <span className="q-lbl" style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: '#1E1B4B' }}>Share a Resource</span>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>

              {/* Message Templates */}
              <div className="q-row" onClick={() => { if (!activeConv || isAnnouncementsActive) return; setShowTemplates(p => !p) }} style={{ opacity: (!activeConv || isAnnouncementsActive) ? 0.5 : 1, cursor: (!activeConv || isAnnouncementsActive) ? 'default' : 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><LayoutTemplate size={15} color="#10B981" /></div>
                <span className="q-lbl" style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: '#1E1B4B' }}>Message Templates</span>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getConversations, getConversation, sendMessage, sendFile } from '../../api/chat'
import { getMatchRequests } from '../../api/matchRequests'
import { getAnnouncements } from '../../api/announcements'
import { getUser } from '../../store/authStore'
import {
  Search, Send, Paperclip, Image, FileText,
  Smile, MoreVertical, Phone, Video, Loader2,
  Megaphone, X, ChevronDown, ChevronUp,
} from 'lucide-react'

const ANNOUNCEMENTS_ID = '__announcements__'

/* ─── helpers ─────────────────────────────────────────────── */

function Avatar({ name = '', color = '#7C3AED', size = 42, online }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color + '22', border: `2px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.32, color, fontFamily: 'inherit',
      }}>
        {initials}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.25, height: size * 0.25, borderRadius: '50%',
          background: online ? '#22C55E' : '#D1D5DB', border: '2px solid white',
        }} />
      )}
    </div>
  )
}

const COLORS = ['#7C3AED','#10B981','#6366F1','#F59E0B','#EC4899','#EF4444']
const getColor = (id) => COLORS[(id || 0) % COLORS.length]

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

/* ─── main page ───────────────────────────────────────────── */

export default function StudentMessagesPage() {
  const me = getUser()
  const [searchParams] = useSearchParams()
  const partnerFromUrl = searchParams.get('partner')

  const [convs,        setConvs]        = useState([])
  const [activeId,     setActiveId]     = useState(null)
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [search,       setSearch]       = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [sending,      setSending]      = useState(false)
  const bottomRef    = useRef(null)
  const prevCountRef = useRef(0)
  const fileRef      = useRef(null)
  const [showEmoji,    setShowEmoji]    = useState(false)
  const [sendingFile,  setSendingFile]  = useState(false)

  // Announcements
  const [announcements,  setAnnouncements]  = useState([])
  const [expandedAnn,    setExpandedAnn]    = useState(null) // id of full-view announcement
  const [annUnread,      setAnnUnread]      = useState(0)

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

  const openFilePicker = (accept) => { if (fileRef.current) { fileRef.current.accept = accept; fileRef.current.click() } }

  // Load conversations + announcements + match requests
  useEffect(() => {
    const load = async () => {
      setLoadingConvs(true)
      try {
        const [convRes, reqRes, annRes] = await Promise.allSettled([
          getConversations(),
          getMatchRequests(),
          getAnnouncements(),
        ])

        // Store announcements
        if (annRes.status === 'fulfilled') {
          const annList = annRes.value?.data || annRes.value?.announcements || annRes.value || []
          const list = Array.isArray(annList) ? annList : []
          setAnnouncements(list)
          setAnnUnread(list.length > 0 ? 1 : 0)
        }

        // Normalize conversations — backend returns participantId, participantName, lastMessage, lastMessageTime, unreadCount
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

        // Deduplicate real convs by partner_id
        const seenIds = new Set()
        const deduped = rawConvs.filter(c => {
          const key = String(c.partner_id)
          if (!c.partner_id || seenIds.has(key)) return false
          seenIds.add(key)
          return true
        })

        // Merge accepted matches who don't yet have a conversation
        // getMatchRequests() returns formatMobileUser objects with top-level id and fullName
        const matched = reqRes.status === 'fulfilled'
          ? (reqRes.value?.data?.data || reqRes.value?.data || [])
          : []
        for (const u of Array.isArray(matched) ? matched : []) {
          const uid = u.id
          if (uid && !seenIds.has(String(uid))) {
            seenIds.add(String(uid))
            deduped.push({
              partner_id:   uid,
              partner_name: u.fullName || u.name || 'User',
              last_message: '',
              unread_count: 0,
            })
          }
        }

        if (partnerFromUrl) {
          const match = deduped.find(c => String(c.partner_id) === String(partnerFromUrl))
          if (!match) {
            deduped.unshift({
              partner_id:   partnerFromUrl,
              partner_name: 'Tutor',
              last_message: '',
              unread_count: 0,
            })
          }
          setActiveId(match?.partner_id ?? partnerFromUrl)
        } else {
          // Default to Announcements channel
          setActiveId(ANNOUNCEMENTS_ID)
        }
        setConvs(deduped)
      } catch {}
      finally { setLoadingConvs(false) }
    }
    load()
  }, [partnerFromUrl])

  // Load messages + poll every 5 s for new replies
  useEffect(() => {
    if (!activeId) return
    prevCountRef.current = 0

    const fetchMsgs = async (initial = false) => {
      if (initial) { setLoadingMsgs(true); setMessages([]) }
      try {
        const res = await getConversation(activeId)
        const msgs = res?.data || res?.messages?.data || res?.messages || []
        if (Array.isArray(msgs)) {
          // Normalize camelCase API fields to snake_case for consistent rendering
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

  // Scroll to bottom only when new messages arrive
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCountRef.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeId || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const optimistic = {
      id: Date.now(), content: text,
      sender_id: me?.id, created_at: new Date().toISOString(),
      is_mine: true,
    }
    setMessages(p => [...p, optimistic])

    try {
      await sendMessage(activeId, text)
    } catch {
      // Remove optimistic on error
      setMessages(p => p.filter(m => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  const isAnnouncementsActive = activeId === ANNOUNCEMENTS_ID
  const activeConv   = convs.find(c => (c.partner_id || c.id) === activeId)
  const partnerName  = isAnnouncementsActive ? 'Study Match' : (activeConv?.partner_name || activeConv?.name || 'User')
  const partnerColor = isAnnouncementsActive ? '#7C3AED' : getColor(activeId)

  const startCall = (mode) => {
    if (!activeId) return
    const url = buildMeetUrl(me?.id, activeId, mode)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const filteredConvs = convs.filter(c => {
    const name = c.partner_name || c.name || ''
    return !search || name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .mp-wrap * { box-sizing: border-box; }
        .mp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; }
        .mp-layout { display: flex; gap: 0; height: calc(100vh - 120px); min-height: 500px; }
        .mp-left { width: 260px; flex-shrink: 0; background: white; border: 1px solid #F0F0F4; border-radius: 16px 0 0 16px; display: flex; flex-direction: column; }
        .mp-center { flex: 1; background: white; border-top: 1px solid #F0F0F4; border-bottom: 1px solid #F0F0F4; display: flex; flex-direction: column; min-width: 0; }
        .conv-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; cursor: pointer; border-radius: 10px; margin: 0 6px 2px; transition: background .12s; }
        .conv-item:hover { background: #F8F9FB; }
        .conv-item.active { background: #F3F0FF; }
        .msgs-area { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
        .msgs-area::-webkit-scrollbar { width: 3px; }
        .msgs-area::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
        .msg-input-field { flex: 1; border: none; outline: none; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #374151; background: transparent; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="mp-wrap">
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Messages</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Communicate with your tutors and study partners.</p>
        </div>

        <div className="mp-layout">
          {/* Left: conversation list */}
          <div className="mp-left">
            <div style={{ padding: '14px 14px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 12px' }}>
                <Search size={13} color="#9CA3AF" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', fontFamily: 'inherit', color: '#374151' }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {/* Pinned Announcements channel */}
              <div
                className={`conv-item${isAnnouncementsActive ? ' active' : ''}`}
                onClick={() => { setActiveId(ANNOUNCEMENTS_ID); setAnnUnread(0) }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: '#F3F0FF', border: '2px solid #DDD6FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Megaphone size={17} color="#7C3AED" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>Study Match</span>
                    {annUnread > 0 && (
                      <span style={{ background: '#7C3AED', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{annUnread}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {announcements.length > 0 ? announcements[0]?.title || 'View messages' : 'No messages yet'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#F0F0F4', margin: '4px 14px 4px' }} />

              {loadingConvs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <Loader2 size={22} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  No conversations yet.
                </div>
              ) : filteredConvs.map(c => {
                const id    = c.partner_id || c.id
                const name  = c.partner_name || c.name || 'User'
                const last  = c.last_message || c.latest_message || ''
                const unread = c.unread_count || 0
                const color = getColor(id)
                return (
                  <div key={id} className={`conv-item${activeId === id ? ' active' : ''}`} onClick={() => setActiveId(id)}>
                    <Avatar name={name} color={color} size={40} online={c.is_online} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{name}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{formatTime(c.last_message_at || c.updated_at)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                          {typeof last === 'string' ? last : last?.content || ''}
                        </span>
                        {unread > 0 && (
                          <span style={{ background: '#7C3AED', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Center: chat / announcements */}
          <div className="mp-center" style={{ borderRadius: '0 16px 16px 0', border: '1px solid #F0F0F4' }}>
            {!activeId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
                Select a conversation to start messaging
              </div>
            ) : isAnnouncementsActive ? (
              /* ── Announcements view ── */
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F3F0FF', border: '2px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={18} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Study Match</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>Official updates and announcements — read only</div>
                  </div>
                </div>

                <div className="msgs-area">
                  {announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>
                      <Megaphone size={28} color="#DDD6FE" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                      No messages from Study Match yet.
                    </div>
                  ) : [...announcements].reverse().map(ann => {
                    const isLong    = (ann.content || '').length > 200
                    const isExpanded = expandedAnn === ann.id
                    const preview   = isLong && !isExpanded
                      ? (ann.content || '').slice(0, 200) + '…'
                      : (ann.content || '')
                    const postedAt  = ann.published_at || ann.created_at
                    return (
                      <div key={ann.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                          maxWidth: '85%', background: '#F8F8FF',
                          border: '1px solid #DDD6FE', borderRadius: '4px 16px 16px 16px',
                          padding: '12px 16px', fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.6,
                          boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                        }}>
                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                            <Megaphone size={13} color="#7C3AED" />
                            <span style={{ fontWeight: 800, fontSize: 13.5, color: '#7C3AED' }}>{ann.title}</span>
                            {ann.is_pinned && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44', borderRadius: 20, padding: '1px 7px' }}>
                                Pinned
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.65 }}>
                            {preview}
                          </div>

                          {/* Expand / collapse for long announcements */}
                          {isLong && (
                            <button
                              onClick={() => setExpandedAnn(isExpanded ? null : ann.id)}
                              style={{
                                marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#7C3AED', fontWeight: 700, fontSize: 12.5, fontFamily: 'inherit',
                                padding: 0,
                              }}>
                              {isExpanded
                                ? <><ChevronUp size={13} /> Show less</>
                                : <><ChevronDown size={13} /> View full announcement</>}
                            </button>
                          )}

                          {/* Footer */}
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9CA3AF' }}>
                            <span>Study Match</span>
                            <span>·</span>
                            <span>{postedAt ? new Date(postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                            <span style={{ marginLeft: 'auto', padding: '1px 8px', borderRadius: 20, background: '#F3F0FF', color: '#7C3AED', fontWeight: 700, fontSize: 10 }}>
                              Read only
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Read-only footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F4', background: '#FAFAFA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 10 }}>
                    <Megaphone size={15} color="#7C3AED" />
                    <span style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                      Messages from Study Match are broadcast-only — you cannot reply here.
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
                  <Avatar name={partnerName} color={partnerColor} size={40} online={activeConv?.is_online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{partnerName}</div>
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
                    <button type="button" title="More"
                      style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <MoreVertical size={15} color="#6B7280" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="msgs-area">
                  {loadingMsgs ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                      <Loader2 size={22} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 24 }}>
                      No messages yet. Say hello! 👋
                    </div>
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
                        <div style={{
                          maxWidth: '68%',
                          background: isMine ? '#F3F0FF' : 'white',
                          border: isMine ? '1px solid #DDD6FE' : '1px solid #F0F0F4',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                          padding: m.message_type === 'image' ? 4 : '10px 14px', fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.5,
                          boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden',
                        }}>
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

                {/* Input */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F4', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                    <input
                      className="msg-input-field"
                      placeholder="Type a message..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    />
                  </div>
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => openFilePicker('*/*')} title="Attach file" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Paperclip size={18} color="#9CA3AF" /></button>
                      <button onClick={() => openFilePicker('image/*')} title="Send image" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Image size={18} color="#9CA3AF" /></button>
                      <button onClick={() => openFilePicker('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')} title="Send document" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><FileText size={18} color="#9CA3AF" /></button>
                      <button onClick={() => setShowEmoji(p => !p)} title="Emoji" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Smile size={18} color={showEmoji ? '#7C3AED' : '#9CA3AF'} /></button>
                    </div>
                    <button onClick={handleSend} disabled={!input.trim() || sending || sendingFile} style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: (input.trim() || sendingFile) ? '#7C3AED' : '#E5E7EB',
                      border: 'none', cursor: (input.trim() || sendingFile) ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background .15s',
                    }}>
                      {sending
                        ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Send size={16} color={input.trim() ? 'white' : '#9CA3AF'} />
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
import { useState, useEffect, useRef } from 'react'
import { getConversations, getConversation, sendMessage } from '../../api/chat'
import { getUser } from '../../store/authStore'
import {
  Search, Send, Paperclip, Image, FileText,
  Smile, MoreVertical, Phone, Video, Loader2,
} from 'lucide-react'

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

/* ─── main page ───────────────────────────────────────────── */

export default function StudentMessagesPage() {
  const me = getUser()

  const [convs,       setConvs]       = useState([])
  const [activeId,    setActiveId]    = useState(null)
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [search,      setSearch]      = useState('')
  const [loadingConvs,setLoadingConvs]= useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending,     setSending]     = useState(false)
  const bottomRef = useRef(null)

  // Load conversations
  useEffect(() => {
    const load = async () => {
      setLoadingConvs(true)
      try {
        const res = await getConversations()
        const data = res?.data || res || []
        setConvs(Array.isArray(data) ? data : [])
        if (data.length > 0) setActiveId(data[0].partner_id || data[0].id)
      } catch {}
      finally { setLoadingConvs(false) }
    }
    load()
  }, [])

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return
    const load = async () => {
      setLoadingMsgs(true)
      setMessages([])
      try {
        const res = await getConversation(activeId)
        const data = res?.data || res || []
        setMessages(Array.isArray(data) ? data : [])
      } catch {}
      finally { setLoadingMsgs(false) }
    }
    load()
  }, [activeId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const activeConv = convs.find(c => (c.partner_id || c.id) === activeId)
  const partnerName = activeConv?.partner_name || activeConv?.name || 'User'
  const partnerColor = getColor(activeId)

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

          {/* Center: chat */}
          <div className="mp-center" style={{ borderRadius: '0 16px 16px 0', border: '1px solid #F0F0F4' }}>
            {!activeId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
                Select a conversation to start messaging
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
                  <Avatar name={partnerName} color={partnerColor} size={40} online={activeConv?.is_online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{partnerName}</div>
                    <div style={{ fontSize: 12, color: activeConv?.is_online ? '#22C55E' : '#9CA3AF', fontWeight: 600, marginTop: 1 }}>
                      {activeConv?.is_online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[Video, Phone, MoreVertical].map((Icon, i) => (
                      <button key={i} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icon size={15} color="#6B7280" />
                      </button>
                    ))}
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
                    const isMine = m.is_mine || m.sender_id === me?.id
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 4 }}>
                        {!isMine && <Avatar name={partnerName} color={partnerColor} size={28} />}
                        <div style={{
                          maxWidth: '68%',
                          background: isMine ? '#F3F0FF' : 'white',
                          border: isMine ? '1px solid #DDD6FE' : '1px solid #F0F0F4',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                          padding: '10px 14px', fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.5,
                          boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                        }}>
                          {m.content || m.message || m.text || ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatTime(m.created_at)}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                    <input
                      className="msg-input-field"
                      placeholder="Type a message..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[Paperclip, Image, FileText, Smile].map((Icon, i) => (
                        <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Icon size={18} color="#9CA3AF" />
                        </button>
                      ))}
                    </div>
                    <button onClick={handleSend} disabled={!input.trim() || sending} style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: input.trim() ? '#7C3AED' : '#E5E7EB',
                      border: 'none', cursor: input.trim() ? 'pointer' : 'default',
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
import { useState, useEffect, useRef } from 'react'
import { getConversations, getConversation, sendMessage } from '../../api/chat'
import { getUser } from '../../store/authStore'
import {
  Search, Video, Phone, MoreVertical, Paperclip,
  Image, FileText, Smile, Send, Users, MessageSquare,
  Share2, Megaphone, LayoutTemplate, ChevronRight,
  Loader2, Calendar,
} from 'lucide-react'

const COLORS = ['#EC4899','#7C3AED','#10B981','#6366F1','#F59E0B','#EF4444']
const getColor    = (i) => COLORS[i % COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

const QUICK_ACTIONS = [
  { icon: MessageSquare, label: 'Start a New Conversation', color: '#7C3AED', bg: '#F3F0FF' },
  { icon: Share2,        label: 'Share a Resource',         color: '#6366F1', bg: '#EEF2FF' },
  { icon: Megaphone,     label: 'Create Announcement',      color: '#F59E0B', bg: '#FFFBEB' },
  { icon: LayoutTemplate,label: 'Message Templates',        color: '#10B981', bg: '#F0FDF4' },
]

export default function TutorMessagesPage() {
  const me = getUser()
  const [convs,        setConvs]        = useState([])
  const [activeId,     setActiveId]     = useState(null)
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [search,       setSearch]       = useState('')
  const [activeTab,    setTab]          = useState('all')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [sending,      setSending]      = useState(false)
  const bottomRef = useRef(null)

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

  useEffect(() => {
    if (!activeId) return
    const load = async () => {
      setLoadingMsgs(true); setMessages([])
      try {
        const res = await getConversation(activeId)
        const data = res?.data || res || []
        setMessages(Array.isArray(data) ? data : [])
      } catch {}
      finally { setLoadingMsgs(false) }
    }
    load()
  }, [activeId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeId || sending) return
    const text = input.trim(); setInput(''); setSending(true)
    const opt = { id: Date.now(), content: text, sender_id: me?.id, created_at: new Date().toISOString(), is_mine: true }
    setMessages(p => [...p, opt])
    try { await sendMessage(activeId, text) }
    catch { setMessages(p => p.filter(m => m.id !== opt.id)) }
    finally { setSending(false) }
  }

  const totalUnread   = convs.reduce((s, c) => s + (c.unread_count || 0), 0)
  const activeConv    = convs.find(c => (c.partner_id || c.id) === activeId)
  const partnerName   = activeConv?.partner_name || activeConv?.name || 'User'
  const partnerIdx    = convs.findIndex(c => (c.partner_id || c.id) === activeId)
  const partnerColor  = getColor(partnerIdx >= 0 ? partnerIdx : 0)

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
        .msgs-area::-webkit-scrollbar { width: 3px; }
        .msgs-area::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
        .q-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; }
        .q-row:last-child { border-bottom: none; }
        .q-row:hover .q-lbl { color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ color: '#1E1B4B' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Messages</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Communicate with your students, share resources, and stay connected.</p>
        </div>

        <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 160px)', minHeight: 560 }}>
          {/* Left */}
          <div className="tm-left">
            <div style={{ padding: '14px 14px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 12px' }}>
                <Search size={13} color="#9CA3AF" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
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

          {/* Center */}
          <div className="tm-center">
            {!activeId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>Select a conversation to start messaging</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
                  <Avatar name={partnerName} color={partnerColor} size={42} online={activeConv?.is_online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{partnerName}</div>
                    <div style={{ fontSize: 12, color: activeConv?.is_online ? '#22C55E' : '#9CA3AF', fontWeight: 600, marginTop: 1 }}>{activeConv?.is_online ? 'Online' : 'Offline'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[Video, Phone, MoreVertical].map((Icon, i) => (
                      <button key={i} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icon size={15} color="#6B7280" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="msgs-area" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {loadingMsgs ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 size={22} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} /></div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 24 }}>No messages yet. Say hello! 👋</div>
                  ) : messages.map(m => {
                    const isMine = m.is_mine || m.sender_id === me?.id
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 4 }}>
                        {!isMine && <Avatar name={partnerName} color={partnerColor} size={28} />}
                        <div style={{ maxWidth: '68%', background: isMine ? '#F3F0FF' : 'white', border: isMine ? '1px solid #DDD6FE' : '1px solid #F0F0F4', borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px', padding: '11px 14px', fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.5 }}>
                          {m.content || m.message || m.text || ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatTime(m.created_at)}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                    <input placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#374151', background: 'transparent' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[Paperclip, Image, FileText, Smile].map((Icon, i) => (
                        <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon size={18} color="#9CA3AF" /></button>
                      ))}
                    </div>
                    <button onClick={handleSend} style={{ width: 40, height: 40, borderRadius: 10, background: '#7C3AED', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sending ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="white" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right */}
          <div className="tm-right" style={{ paddingLeft: 20 }}>
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Active Sessions</div>
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>No active sessions</div>
              </div>
            </div>
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 10 }}>Quick Actions</div>
              {QUICK_ACTIONS.map(({ icon: Icon, label, color, bg }) => (
                <div key={label} className="q-row">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={15} color={color} /></div>
                  <span className="q-lbl" style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: '#1E1B4B' }}>{label}</span>
                  <ChevronRight size={14} color="#D1D5DB" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
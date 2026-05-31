import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../../store/authStore'
import { getPotentialPartners } from '../../api/partners'
import { getIncomingRequests } from '../../api/matchRequests'
import { getSessions } from '../../api/sessions'
import { getSubjects } from '../../api/subjects'
import { Search, X, User, BookOpen, Calendar, Loader2 } from 'lucide-react'

function useDebounce(value, ms) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function GlobalSearch({ placeholder = 'Search...' }) {
  const navigate = useNavigate()
  const user     = getUser()
  const isTutor  = user?.role === 'tutor'

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const wrapRef = useRef(null)

  const debouncedQuery = useDebounce(query, 300)

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const lower = q.toLowerCase()
      const hits  = []

      const [partnersRes, sessRes, subjectsRes] = await Promise.allSettled([
        isTutor ? getIncomingRequests() : getPotentialPartners({ search: q }),
        getSessions(),
        getSubjects(),
      ])

      // People
      if (partnersRes.status === 'fulfilled') {
        const list = partnersRes.value?.data?.data || partnersRes.value?.data || []
        ;(Array.isArray(list) ? list : []).forEach(p => {
          const name = p.student?.user?.name || p.fullName || p.name || ''
          if (name.toLowerCase().includes(lower)) {
            hits.push({
              type: 'person',
              label: name,
              sub:   isTutor ? 'Student' : 'Tutor',
              to:    isTutor ? `/tutor/find-students` : `/student/find-tutors`,
            })
          }
        })
      }

      // Sessions
      if (sessRes.status === 'fulfilled') {
        const list = sessRes.value?.data || []
        ;(Array.isArray(list) ? list : []).forEach(s => {
          const subject = s.subject?.name || ''
          const partner = isTutor ? s.student?.user?.name : s.tutor?.user?.name
          const label   = subject || (partner ? `Session with ${partner}` : 'Session')
          if (label.toLowerCase().includes(lower) || (partner || '').toLowerCase().includes(lower)) {
            hits.push({
              type:  'session',
              label,
              sub:   s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Session',
              to:    isTutor ? '/tutor/study-sessions' : '/student/study-sessions',
            })
          }
        })
      }

      // Subjects
      if (subjectsRes.status === 'fulfilled') {
        const list = subjectsRes.value?.data || subjectsRes.value || []
        ;(Array.isArray(list) ? list : []).forEach(s => {
          if (s.name.toLowerCase().includes(lower)) {
            hits.push({
              type:  'subject',
              label: s.name,
              sub:   'Subject',
              to:    isTutor ? '/tutor/discover-students' : '/student/find-tutors',
            })
          }
        })
      }

      // Deduplicate by label
      const seen = new Set()
      setResults(hits.filter(h => {
        const key = `${h.type}:${h.label}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 8))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [isTutor])

  useEffect(() => {
    if (debouncedQuery) {
      setOpen(true)
      runSearch(debouncedQuery)
    } else {
      setResults([])
      setOpen(false)
    }
  }, [debouncedQuery, runSearch])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const ICONS = {
    person:  <User size={13} color="#7C3AED" />,
    session: <Calendar size={13} color="#6366F1" />,
    subject: <BookOpen size={13} color="#10B981" />,
  }

  const handleSelect = (result) => {
    navigate(result.to)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 10,
        padding: '8px 14px', transition: 'border-color .15s',
        ...(open || query ? { borderColor: '#7C3AED', background: 'white' } : {}),
      }}>
        {loading ? <Loader2 size={15} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} /> : <Search size={15} color="#9CA3AF" style={{ flexShrink: 0 }} />}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13.5, color: '#374151', background: 'transparent', fontFamily: 'DM Sans, sans-serif' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#9CA3AF' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,.10)', zIndex: 200, overflow: 'hidden',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Searching…
            </div>
          ) : results.map((r, i) => (
            <button key={i} onClick={() => handleSelect(r)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none',
                background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i < results.length - 1 ? '1px solid #F8F9FB' : 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8F9FB'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICONS[r.type]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1E1B4B' }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

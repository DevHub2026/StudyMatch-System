import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, GraduationCap, ShieldCheck, Flag, Loader2 } from 'lucide-react'
import api from '../../api/axiosInstance'

export default function AdminDashboardPage() {
  const [stats,        setStats]        = useState({ users: 0, tutors: 0, pending: 0, reports: 0 })
  const [pendingTutors,setPendingTutors]= useState([])
  const [recentReports,setRecentReports]= useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [statsRes, tutorsRes, complaintsRes] = await Promise.allSettled([
          api.get('/admin/stats'),
          api.get('/admin/tutors/pending'),
          api.get('/admin/complaints', { params: { status: 'open', per_page: 5 } }),
        ])

        if (statsRes.status === 'fulfilled') {
          const d = statsRes.value?.data || {}
          setStats({
            users:   d.users?.total                  ?? 0,
            tutors:  d.users?.tutors                 ?? 0,
            pending: d.users?.pending_tutor_approval ?? 0,
            reports: d.support?.open_complaints      ?? 0,
          })
        }

        if (tutorsRes.status === 'fulfilled') {
          const d = tutorsRes.value?.data?.tutors || tutorsRes.value?.data || []
          setPendingTutors(Array.isArray(d) ? d.slice(0, 4) : [])
        }

        if (complaintsRes.status === 'fulfilled') {
          const d = complaintsRes.value?.data?.data || []
          setRecentReports(Array.isArray(d) ? d.slice(0, 4) : [])
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const STAT_CARDS = [
    { title: 'Total Users',           value: stats.users,   color: '#6D5DFC', icon: Users         },
    { title: 'Total Tutors',          value: stats.tutors,  color: '#22C55E', icon: GraduationCap },
    { title: 'Pending Verifications', value: stats.pending, color: '#F59E0B', icon: ShieldCheck   },
    { title: 'Reports',               value: stats.reports, color: '#EF4444', icon: Flag          },
  ]

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        {STAT_CARDS.map(({ title, value, color, icon: Icon }) => (
          <div key={title} style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E5E7EB' }}>
            <div style={{ width: 55, height: 55, borderRadius: 16, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Icon size={24} color={color} />
            </div>
            <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#111827' }}>
              {value > 999 ? value.toLocaleString() : value}
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Pending Tutor Verifications */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Pending Tutor Verifications</h2>
            <Link to="/admin/tutors/pending" style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>

          {pendingTutors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 14 }}>
              No pending verifications
            </div>
          ) : pendingTutors.map((tutor, i) => {
            const name = tutor.name || tutor.user?.name || 'Unknown'
            const date = tutor.created_at
              ? new Date(tutor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Applied recently'
            return (
              <div key={tutor.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < pendingTutors.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{name}</div>
                  <div style={{ color: '#6B7280', fontSize: 14 }}>{date}</div>
                </div>
                <Link to={`/admin/tutors/pending`} style={{ background: '#F3F0FF', color: '#6D5DFC', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                  Review
                </Link>
              </div>
            )
          })}
        </div>

        {/* Recent Reports */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Open Complaints</h2>
            <Link to="/admin/complaints" style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>

          {recentReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 14 }}>
              No open complaints
            </div>
          ) : recentReports.map((complaint, i) => {
            const subject = complaint.subject || 'Complaint'
            const status  = complaint.status  || 'open'
            return (
              <div key={complaint.id || i} style={{ padding: '14px 0', borderBottom: i < recentReports.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6 }}>{subject}</div>
                <div style={{ color: '#6B7280', fontSize: 14, textTransform: 'capitalize' }}>{status}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
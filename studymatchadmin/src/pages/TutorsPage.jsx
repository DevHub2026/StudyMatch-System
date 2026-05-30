import { useEffect, useState } from 'react'
import {
  BookOpen, Users, FileText, GraduationCap, X, Loader2,
  CheckCircle, XCircle, Clock, Star, Calendar, Briefcase,
  Award, Search, ChevronDown, AlertTriangle, Info,
} from 'lucide-react'
import { getPendingTutors, approveTutor, rejectTutor } from '../api/user'
import { getAllTutors, getSubjects, assignSubject, updateTutorSubject, removeTutorSubject } from '../api/subjects'

// ── Badges ────────────────────────────────────────────────────────────────────

const VerificationBadge = ({ status }) => {
  const cfg = {
    pending:  { cls: 'bg-amber-100 text-amber-700',   icon: Clock },
    approved: { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { cls: 'bg-red-100 text-red-600',        icon: XCircle },
  }
  const { cls, icon: Icon } = cfg[status] ?? { cls: 'bg-gray-100 text-gray-600', icon: Clock }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={10} /> {status}
    </span>
  )
}

const TutorTypeBadge = ({ type }) => {
  const styles = {
    professor:     'bg-indigo-50 text-indigo-700 border-indigo-200',
    instructor:    'bg-blue-50 text-blue-700 border-blue-200',
    student_tutor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[type] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {(type ?? 'unknown').replace('_', ' ')}
    </span>
  )
}

const ExpertiseBadge = ({ level }) => {
  const styles = {
    competent:  'bg-gray-100 text-gray-600',
    proficient: 'bg-blue-50 text-blue-600',
    expert:     'bg-indigo-50 text-indigo-600',
    master:     'bg-purple-50 text-purple-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[level] ?? 'bg-gray-100 text-gray-500'}`}>
      {level}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBio(bio) {
  if (!bio) return null
  try { return JSON.parse(bio) } catch { return null }
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
    <span className="text-gray-500 shrink-0 pr-4">{label}</span>
    <span className="font-medium text-gray-700 text-right">{value || '—'}</span>
  </div>
)

function Avatar({ name = '', size = 10, color = 'bg-indigo-100 text-indigo-600' }) {
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center font-bold text-${size > 10 ? 'xl' : 'sm'} flex-shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

// ── Subject assignment panel ──────────────────────────────────────────────────

function SubjectPanel({ tutor }) {
  const [assigned,    setAssigned]    = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [adding,      setAdding]      = useState(false)
  const [showAdd,     setShowAdd]     = useState(false)
  const [addForm,     setAddForm]     = useState({ subject_id: '', expertise_level: 'proficient', years_teaching: 0 })
  const [removing,    setRemoving]    = useState(null)
  const [editingId,   setEditingId]   = useState(null)
  const [editForm,    setEditForm]    = useState({})
  const [updating,    setUpdating]    = useState(false)
  const [msg,         setMsg]         = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [subRes, catRes] = await Promise.all([
        import('../api/subjects').then(m => m.getTutorSubjects(tutor.id)),
        getSubjects(),
      ])
      setAssigned(subRes.data?.subjects ?? [])
      setAllSubjects(catRes.data?.subjects ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tutor.id])

  const assignedIds = new Set(assigned.map(s => s.subject_id))
  const unassigned  = allSubjects.filter(s => !assignedIds.has(s.id))
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  const handleAdd = async () => {
    if (!addForm.subject_id) return
    setAdding(true)
    try {
      await assignSubject(tutor.id, {
        subject_id: parseInt(addForm.subject_id),
        expertise_level: addForm.expertise_level,
        years_teaching: parseInt(addForm.years_teaching) || 0
      })
      flash('Subject assigned.')
      setShowAdd(false)
      setAddForm({ subject_id: '', expertise_level: 'proficient', years_teaching: 0 })
      load()
    } catch (e) { flash(e.response?.data?.message || 'Failed.') }
    finally { setAdding(false) }
  }

  const handleUpdate = async (ts) => {
    setUpdating(true)
    try {
      await updateTutorSubject(tutor.id, ts.subject_id, editForm)
      flash('Updated.')
      setEditingId(null)
      load()
    } catch { flash('Failed to update.') }
    finally { setUpdating(false) }
  }

  const handleRemove = async (ts) => {
    if (!window.confirm(`Remove "${ts.subject?.name}" from this tutor?`)) return
    setRemoving(ts.id)
    try {
      await removeTutorSubject(tutor.id, ts.subject_id)
      flash('Removed.')
      setAssigned(a => a.filter(x => x.id !== ts.id))
    } catch { flash('Failed.') }
    finally { setRemoving(null) }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-indigo-400" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assigned Subjects</p>
          <p className="text-xs text-gray-400 mt-0.5">{assigned.length} subject{assigned.length !== 1 ? 's' : ''} assigned</p>
        </div>
        {unassigned.length > 0 && (
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            + Assign Subject
          </button>
        )}
      </div>

      {msg && (
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle size={12} /> {msg}
        </div>
      )}

      {showAdd && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2.5">
          <p className="text-xs font-semibold text-indigo-600">Add Subject</p>
          <select value={addForm.subject_id} onChange={e => setAddForm(p => ({ ...p, subject_id: e.target.value }))}
            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
            <option value="">Select subject...</option>
            {unassigned.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <div className="flex gap-2">
            <select value={addForm.expertise_level} onChange={e => setAddForm(p => ({ ...p, expertise_level: e.target.value }))}
              className="flex-1 border border-gray-200 bg-white rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
              {['competent','proficient','expert','master'].map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
            </select>
            <input type="number" min={0} max={50} value={addForm.years_teaching}
              onChange={e => setAddForm(p => ({ ...p, years_teaching: e.target.value }))}
              placeholder="Yrs" className="w-16 border border-gray-200 bg-white rounded-lg px-2.5 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding || !addForm.subject_id}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
              {adding ? 'Assigning...' : 'Assign'}
            </button>
            <button onClick={() => setShowAdd(false)}
              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold py-2 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {assigned.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <BookOpen size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">No subjects assigned yet</p>
          <p className="text-xs text-gray-300 mt-1">Use the button above to assign subjects.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assigned.map(ts => (
            <div key={ts.id} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              {editingId === ts.id ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">{ts.subject?.name}</p>
                  <div className="flex gap-2">
                    <select value={editForm.expertise_level} onChange={e => setEditForm(p => ({ ...p, expertise_level: e.target.value }))}
                      className="flex-1 border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                      {['competent','proficient','expert','master'].map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                    </select>
                    <input type="number" min={0} max={50} value={editForm.years_teaching}
                      onChange={e => setEditForm(p => ({ ...p, years_teaching: e.target.value }))}
                      className="w-14 border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleUpdate(ts)} disabled={updating}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-1.5 rounded-lg">
                      {updating ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{ts.subject?.name}</p>
                      <ExpertiseBadge level={ts.expertise_level} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ts.years_teaching ?? 0} yr{ts.years_teaching !== 1 ? 's' : ''} teaching
                      {ts.is_primary_expertise ? ' · Primary' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => { setEditingId(ts.id); setEditForm({ expertise_level: ts.expertise_level, years_teaching: ts.years_teaching ?? 0 }) }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">Edit</button>
                    <button onClick={() => handleRemove(ts)} disabled={removing === ts.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 font-semibold">
                      {removing === ts.id ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({ tutor, processing, rejectMsg, setRejectMsg, onApprove, onReject, onClose }) {
  const [tab,        setTab]        = useState('overview')
  const [confirmStep, setConfirmStep] = useState(null) // 'approve' | 'reject' | null
  const bio   = parseBio(tutor.bio)
  const name  = tutor.user?.name ?? '?'
  const email = tutor.user?.email ?? '—'
  const dept  = bio?.department ?? tutor.specialization ?? '—'

  const TABS = [
    { key: 'overview',  label: 'Overview',         icon: Info         },
    { key: 'academic',  label: 'Academic Info',     icon: GraduationCap },
    { key: 'tutoring',  label: 'Tutoring Details',  icon: BookOpen     },
    { key: 'documents', label: 'Documents',          icon: FileText     },
    { key: 'subjects',  label: 'Assign Subjects',   icon: BookOpen     },
  ]

  const isPending  = tutor.verification_status === 'pending'
  const isApproved = tutor.verification_status === 'approved'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-white rounded-t-2xl">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-bold text-xl text-indigo-600 flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800 text-lg">{name}</span>
              <VerificationBadge status={tutor.verification_status ?? 'pending'} />
              <TutorTypeBadge type={tutor.tutor_type} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span>{email}</span>
              {dept !== '—' && <><span>·</span><span>{dept}</span></>}
              {tutor.created_at && <><span>·</span><span>Applied {new Date(tutor.created_at).toLocaleDateString()}</span></>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 px-6 border-b border-gray-100 bg-white overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}>
                <Icon size={12} /> {t.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-4">

              {/* Key highlights grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: GraduationCap, label: 'Department',    value: bio?.department ?? tutor.specialization ?? '—',   color: '#7C3AED', bg: '#F3F0FF' },
                  { icon: Briefcase,     label: 'Position',       value: tutor.position ?? '—',                            color: '#6366F1', bg: '#EEF2FF' },
                  { icon: Award,         label: 'Experience',     value: bio?.experience ? `${bio.experience}` : '—',      color: '#F59E0B', bg: '#FFFBEB' },
                  { icon: BookOpen,      label: 'Education',      value: bio?.education ?? tutor.credentials ?? '—',       color: '#10B981', bg: '#F0FDF4' },
                  { icon: Calendar,      label: 'Teaching Mode',  value: bio?.teaching_mode ?? '—',                        color: '#3B82F6', bg: '#EFF6FF' },
                  { icon: Users,         label: 'Grade Levels',   value: bio?.grade_levels?.join(', ') ?? '—',             color: '#EC4899', bg: '#FDF2F8' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{label}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Self-reported subjects */}
              {bio?.subjects?.length > 0 && (
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                    Self-reported Subjects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bio.subjects.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-white text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultation schedule */}
              {(bio?.days?.length > 0 || bio?.from_time) && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
                    Consultation Hours
                  </p>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    {bio?.days?.length > 0 && (
                      <span><span className="font-semibold">Days:</span> {bio.days.join(', ')}</span>
                    )}
                    {bio?.from_time && bio?.to_time && (
                      <span><span className="font-semibold">Time:</span> {bio.from_time} – {bio.to_time}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Admin notes if rejected before */}
              {tutor.verification_status === 'rejected' && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Previously Rejected</p>
                    <p className="text-xs text-red-500 mt-0.5">This tutor's application was previously rejected.</p>
                  </div>
                </div>
              )}

              {isApproved && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Verified Tutor</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-emerald-600">
                      {tutor.average_rating > 0 && (
                        <span className="flex items-center gap-1"><Star size={11} fill="currentColor" /> {parseFloat(tutor.average_rating).toFixed(1)} rating</span>
                      )}
                      <span>{tutor.total_sessions ?? 0} sessions completed</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACADEMIC INFO */}
          {tab === 'academic' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Professional</p>
                <div className="space-y-0">
                  <InfoRow label="Department / Faculty"   value={bio?.department ?? tutor.specialization} />
                  <InfoRow label="Position"               value={tutor.position} />
                  <InfoRow label="Tutor Type"             value={tutor.tutor_type?.replace('_', ' ')} />
                  <InfoRow label="Employee ID"            value={tutor.employee_id} />
                  <InfoRow label="Years of Experience"    value={bio?.experience} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Credentials</p>
                <div className="space-y-0">
                  <InfoRow label="Educational Attainment" value={bio?.education ?? tutor.credentials} />
                  <InfoRow label="Teaching License No."   value={bio?.teaching_license || null} />
                  <InfoRow label="Dean's List"            value={tutor.is_deans_list ? 'Yes' : 'No'} />
                  {tutor.gpa && <InfoRow label="GPA"      value={tutor.gpa} />}
                  <InfoRow label="Applied"                value={tutor.created_at ? new Date(tutor.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
                </div>
              </div>

              {/* Credentials text */}
              {tutor.credentials && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Credentials / Notes</p>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed border border-gray-100">
                    {tutor.credentials}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TUTORING DETAILS */}
          {tab === 'tutoring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Teaching Approach</p>
                  <InfoRow label="Teaching Style" value={bio?.teaching_style} />
                  <InfoRow label="Teaching Mode"  value={bio?.teaching_mode} />
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Schedule</p>
                  <InfoRow label="Days"       value={bio?.days?.join(', ')} />
                  <InfoRow label="Hours"      value={bio?.from_time && bio?.to_time ? `${bio.from_time} – ${bio.to_time}` : null} />
                </div>
              </div>

              {bio?.grade_levels?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Grade Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {bio.grade_levels.map(g => (
                      <span key={g} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {bio?.subjects?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Subjects (Self-reported)</p>
                  <div className="flex flex-wrap gap-2">
                    {bio.subjects.map(s => (
                      <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {!bio && (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <BookOpen size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No tutoring details on file</p>
                  <p className="text-xs text-gray-300 mt-1">This tutor registered before the detailed form was available.</p>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS */}
          {tab === 'documents' && (
            <div className="space-y-3">
              {tutor.verification_documents && Object.keys(tutor.verification_documents).length > 0 ? (
                Object.entries(tutor.verification_documents).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={17} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400 truncate">{typeof val === 'string' ? val : 'File uploaded'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle size={10} /> Uploaded
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-400">No documents uploaded</p>
                  <p className="text-xs text-gray-300 mt-1">The tutor has not submitted verification documents yet.</p>
                </div>
              )}
            </div>
          )}

          {/* SUBJECTS (ADMIN) */}
          {tab === 'subjects' && (
            <SubjectPanel tutor={tutor} />
          )}

        </div>

        {/* ── Action footer ── */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 rounded-b-2xl space-y-3">

          {/* Confirm step overlay */}
          {confirmStep === 'approve' && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-700">Confirm Approval</p>
                <p className="text-xs text-emerald-600">This tutor will gain full platform access.</p>
              </div>
              <button onClick={onApprove} disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                {processing ? 'Approving...' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmStep(null)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium px-3 py-2">
                Cancel
              </button>
            </div>
          )}

          {confirmStep === 'reject' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                <p className="text-sm font-semibold text-red-700">Confirm Rejection</p>
              </div>
              <textarea value={rejectMsg} onChange={e => setRejectMsg(e.target.value)} rows={2}
                placeholder="Optional: provide a reason for rejection..."
                className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 resize-none" />
              <div className="flex gap-2">
                <button onClick={onReject} disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button onClick={() => setConfirmStep(null)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!confirmStep && (
            <div className="flex gap-2">
              {!isApproved && (
                <button onClick={() => setConfirmStep('approve')} disabled={processing}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                  <CheckCircle size={15} /> Approve Tutor
                </button>
              )}
              {tutor.verification_status !== 'rejected' && (
                <button onClick={() => setConfirmStep('reject')} disabled={processing}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                  <XCircle size={15} /> Reject
                </button>
              )}
              <button onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TutorsPage() {
  const [activeTab,   setActiveTab]   = useState('pending')
  const [tutors,      setTutors]      = useState([])
  const [allTutors,   setAllTutors]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [allLoading,  setAllLoading]  = useState(true)
  const [error,       setError]       = useState('')
  const [selected,    setSelected]    = useState(null)
  const [actionMsg,   setActionMsg]   = useState('')
  const [rejectMsg,   setRejectMsg]   = useState('')
  const [processing,  setProcessing]  = useState(false)
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchPending = async () => {
    setLoading(true); setError('')
    try {
      const res = await getPendingTutors()
      setTutors(Array.isArray(res.data?.tutors) ? res.data.tutors : [])
    } catch { setError('Failed to load pending tutors.') }
    finally { setLoading(false) }
  }

  const fetchAll = async () => {
    setAllLoading(true)
    try {
      const res = await getAllTutors()
      setAllTutors(Array.isArray(res.data?.tutors) ? res.data.tutors : [])
    } catch {} finally { setAllLoading(false) }
  }

  useEffect(() => { fetchPending(); fetchAll() }, [])

  const handleApprove = async (id) => {
    setProcessing(true)
    try {
      await approveTutor(id)
      setActionMsg('Tutor approved — they can now fully access the platform.')
      setSelected(null)
      fetchPending(); fetchAll()
    } catch { setActionMsg('Failed to approve tutor.') }
    finally { setProcessing(false) }
  }

  const handleReject = async (id) => {
    setProcessing(true)
    try {
      await rejectTutor(id, { reason: rejectMsg || 'Application rejected by admin.' })
      setActionMsg('Tutor application rejected.')
      setSelected(null); setRejectMsg('')
      fetchPending(); fetchAll()
    } catch { setActionMsg('Failed to reject tutor.') }
    finally { setProcessing(false) }
  }

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  // All tutors: search + status filter
  const filteredAll = allTutors.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || (t.user?.name ?? '').toLowerCase().includes(q) || (t.user?.email ?? '').toLowerCase().includes(q)
    const matchStatus = !statusFilter || t.verification_status === statusFilter
    return matchSearch && matchStatus
  })

  const bioOf = t => parseBio(t.bio)

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tutor Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Review tutor applications and manage subject assignments.</p>
        </div>
        {tutors.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-sm font-semibold">
            <Clock size={14} /> {tutors.length} pending review
          </div>
        )}
      </div>

      {/* Toast messages */}
      {actionMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle size={15} /> {actionMsg}
          <button onClick={() => setActionMsg('')} className="ml-auto text-green-500 hover:text-green-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100">
        {[
          { key: 'pending', label: 'Pending Applications', count: tutors.length },
          { key: 'all',     label: 'All Tutors',           count: allTutors.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.key ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${
                tab.key === 'pending' && tab.count > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending tab ── */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={36} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">All caught up!</p>
              <p className="text-gray-400 text-sm mt-1">No pending tutor applications.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Tutor</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Department / Faculty</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Position</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Applied</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map(tutor => {
                  const bio = bioOf(tutor)
                  return (
                    <tr key={tutor.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0">
                            {(tutor.user?.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{tutor.user?.name ?? '—'}</div>
                            <div className="text-xs text-gray-400">{tutor.user?.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">
                        {bio?.department ?? tutor.specialization ?? '—'}
                      </td>
                      <td className="px-5 py-3.5"><TutorTypeBadge type={tutor.tutor_type} /></td>
                      <td className="px-5 py-3.5 text-gray-600">{tutor.position ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(tutor.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelected(tutor); setRejectMsg('') }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            Review
                          </button>
                          <button onClick={() => { setSelected(tutor); setRejectMsg('') }}
                            className="bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── All Tutors tab ── */}
      {activeTab === 'all' && (
        <>
          {/* Search + filter bar */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name or email..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div className="flex gap-1.5">
              {['', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {allLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
              </div>
            ) : filteredAll.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No tutors found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Tutor</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Department</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Rating</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Sessions</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Subjects</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.map(tutor => {
                    const bio = bioOf(tutor)
                    const rating = parseFloat(tutor.average_rating ?? 0)
                    return (
                      <tr key={tutor.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                              {(tutor.user?.name ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{tutor.user?.name ?? '—'}</div>
                              <div className="text-xs text-gray-400">{tutor.user?.email ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><TutorTypeBadge type={tutor.tutor_type} /></td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs max-w-32 truncate">
                          {bio?.department ?? tutor.specialization ?? '—'}
                        </td>
                        <td className="px-5 py-3.5"><VerificationBadge status={tutor.verification_status} /></td>
                        <td className="px-5 py-3.5">
                          {rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-amber-400 fill-amber-400" />
                              <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-600">
                          {tutor.total_sessions ?? 0}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {(tutor.strong_subjects ?? []).length} subject{(tutor.strong_subjects ?? []).length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => { setSelected(tutor); setRejectMsg('') }}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">
                            Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Review Modal */}
      {selected && (
        <ReviewModal
          tutor={selected}
          processing={processing}
          rejectMsg={rejectMsg}
          setRejectMsg={setRejectMsg}
          onApprove={() => handleApprove(selected.id)}
          onReject={() => handleReject(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

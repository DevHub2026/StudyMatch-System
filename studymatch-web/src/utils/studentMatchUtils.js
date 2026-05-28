const SAVED_KEY = 'studymatch_tutor_saved_students';

export function getSavedStudentIds() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function setSavedStudentIds(ids) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

export function toggleSavedStudentId(id) {
  const numId = Number(id);
  const ids = getSavedStudentIds();
  const next = ids.includes(numId) ? ids.filter(x => x !== numId) : [...ids, numId];
  setSavedStudentIds(next);
  return next;
}

/** Subjects from request subject or student "Subjects I need help with" (weak_subjects). */
export function getStudentHelpSubjects(request) {
  const student = request?.student || {};
  if (request?.subject?.name) {
    return [request.subject.name];
  }
  const fromWeak = (student.weak_subjects || student.weakSubjects || [])
    .filter(ws => ws.needs_help !== false)
    .map(ws => ws.subject?.name)
    .filter(Boolean);
  if (fromWeak.length) return fromWeak;
  const program = (student.program || '').trim();
  return program ? [program] : [];
}

export function normalizeStudentFromMatchRequest(request, index = 0) {
  const student = request.student || {};
  const name = student.user?.name || student.user?.email || 'Student';
  const subjects = getStudentHelpSubjects(request);

  return {
    id: student.id,
    user_id: student.user?.id,
    name,
    department: student.program || student.department || '',
    program: student.program,
    year_level: student.year_level,
    subjects,
    goal: request.message || student.study_goals || '',
    study_goals: student.study_goals || request.message || '',
    availability: [student.preferred_days, student.preferred_time].filter(Boolean).join(' · '),
    study_style: student.study_style || '',
    session_preference: inferSessionPreference(student.study_style),
    match_percentage: null,
    is_online: false,
    activity_label: '',
    index,
  };
}

function inferSessionPreference(studyStyle) {
  const s = String(studyStyle ?? '').toLowerCase();
  if (s === 'online') return 'Online';
  if (s.includes('face') || s.includes('person') || s === 'face-to-face') return 'Face-to-face';
  if (s.includes('online or')) return 'Online or In-person';
  if (s.includes('online') && !s.includes('person')) return 'Online';
  return s ? 'Online or In-person' : '';
}

export function filterStudentsBySearch(students, query) {
  if (!query?.trim()) return students;
  const q = query.toLowerCase().trim();
  return students.filter(s => {
    const name = (s.name || s.user?.name || '').toLowerCase();
    const program = (s.program || s.department || '').toLowerCase();
    const goals = (s.study_goals || s.goal || '').toLowerCase();
    const subjects = (s.subjects || s.help_subjects || [])
      .map(x => (typeof x === 'object' ? (x?.name ?? '') : (x ?? '')))
      .join(' ')
      .toLowerCase();
    return name.includes(q) || program.includes(q) || goals.includes(q) || subjects.includes(q);
  });
}

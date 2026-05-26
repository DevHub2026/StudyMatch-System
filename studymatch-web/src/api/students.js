import api from './axiosInstance';

/**
 * Browse students for tutor discovery (filters + match scores from API).
 */
export const browseStudents = async (filters = {}) => {
  const params = new URLSearchParams();

  params.append('target_role', 'student');
  if (filters.matchAll !== false) params.append('match_all', '1');
  if (filters.strict) params.append('strict', '1');
  if (filters.search) params.append('search', filters.search);
  if (filters.subject && filters.subject !== 'All Subjects') params.append('subject', filters.subject);
  if (filters.availability && filters.availability !== 'Availability') {
    params.append('availability', filters.availability);
  }
  if (filters.goal && filters.goal !== 'Learning Goals') params.append('goal', filters.goal);
  if (filters.studyStyle) params.append('study_style', filters.studyStyle);
  if (filters.yearLevel) params.append('year_level', filters.yearLevel);

  const qs = params.toString();
  const response = await api.get(qs ? `/students?${qs}` : '/students');
  return response.data;
};

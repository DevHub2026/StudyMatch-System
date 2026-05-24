import api from './axiosInstance';

export const getMyComplaints = async () => {
  try {
    const response = await api.get('/complaints');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch complaints:', error);
    throw error;
  }
};

export const submitComplaint = async (reportedUserId, category, description) => {
  try {
    const response = await api.post('/complaints', {
      reported_user_id: reportedUserId,
      category,
      description
    });
    return response.data;
  } catch (error) {
    console.error('Failed to submit complaint:', error);
    throw error;
  }
};
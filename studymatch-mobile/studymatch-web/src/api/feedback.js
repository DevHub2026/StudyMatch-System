import api from './axiosInstance';

export const getMyFeedback = async () => {
  try {
    const response = await api.get('/feedback/my-feedback'); // Changed from /feedback
    return response.data;
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    throw error;
  }
};

export const submitFeedback = async (type, message, rating) => {
  try {
    const response = await api.post('/feedback/submit', {
      type,
      message,
      rating
    });
    return response.data;
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    throw error;
  }
};
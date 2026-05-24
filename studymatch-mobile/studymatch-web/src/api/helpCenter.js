import api from './axiosInstance';

export const getMyTickets = async () => {
  try {
    const response = await api.get('/help-center'); // This should work
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    throw error;
  }
};

export const submitTicket = async (subject, category, description, priority) => {
  try {
    const response = await api.post('/help-center/submit', {
      subject,
      category,
      description,
      priority
    });
    return response.data;
  } catch (error) {
    console.error('Failed to submit ticket:', error);
    throw error;
  }
};
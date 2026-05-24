import api from './axiosInstance';

export const getConversations = async () => {
  try {
    const response = await api.get('/chat/conversations'); // Changed from /chat
    return response.data;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    throw error;
  }
};

export const getConversation = async (partnerId) => {
  try {
    const response = await api.get(`/chat/${partnerId}/messages`); // Changed
    return response.data;
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    throw error;
  }
};

export const sendMessage = async (partnerId, content) => {
  try {
    const response = await api.post('/chat/send', {
      receiver_id: partnerId,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};
import api from './axiosInstance';

export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await api.post('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    throw error;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const response = await api.delete('/notifications/all');
    return response.data;
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    throw error;
  }
};
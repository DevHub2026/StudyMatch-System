import api from './axiosInstance';

export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

// Profile Setup Steps (ADD THESE)
export const updateProfileStep1 = async (data) => {
  try {
    const response = await api.put('/profile/step-1', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile step 1:', error);
    throw error;
  }
};

export const updateProfileStep2 = async (data) => {
  try {
    const response = await api.put('/profile/step-2', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile step 2:', error);
    throw error;
  }
};

export const updateProfileStep3 = async (data) => {
  try {
    const response = await api.put('/profile/step-3', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile step 3:', error);
    throw error;
  }
};

export const updateProfileStep4 = async (data) => {
  try {
    const response = await api.put('/profile/step-4', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile step 4:', error);
    throw error;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await api.put('/profile/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Failed to update password:', error);
    throw error;
  }
};

export const deleteAccount = async () => {
  try {
    const response = await api.delete('/profile/delete-account');
    return response.data;
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw error;
  }
};
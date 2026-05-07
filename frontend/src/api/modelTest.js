import axiosInstance from './axiosInstance'

export const modelTestApi = {
  // Upload a model file (multipart/form-data)
  uploadModel: (formData) =>
    axiosInstance.post('/models/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),

  // Get all uploaded test models
  getModels: () => axiosInstance.get('/models/'),

  // Delete a test model
  deleteModel: (modelId) => axiosInstance.delete(`/models/${modelId}`),

  // Run prediction
  predict: (payload) => axiosInstance.post('/models/predict', payload),
}

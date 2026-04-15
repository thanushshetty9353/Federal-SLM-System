import axiosInstance from './axiosInstance'

export const orgApi = {
  uploadDocument: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosInstance.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
  },
  getJobs: () => axiosInstance.get('/org/jobs'),
  joinJob: (jobId) => axiosInstance.post(`/org/jobs/${jobId}/join`),
  requestGlobalAccess: () => axiosInstance.post('/org/request-global-access'),
  trainLocal: (jobId) => axiosInstance.post(`/org/train/${jobId}`),
  downloadLocalModel: (jobId) => axiosInstance.get(`/org/download-model/${jobId}`, { responseType: 'blob' }),
  downloadGlobalModel: (jobId) => axiosInstance.get(`/org/global-model/${jobId}`, { responseType: 'blob' }),
}

import axiosInstance from './axiosInstance'

export const adminApi = {
  getPendingUsers: () => axiosInstance.get('/admin/pending-users'),
  getAllUsers: () => axiosInstance.get('/admin/all-users'),
  approveUser: (id) => axiosInstance.post(`/admin/approve/${id}`),
  rejectUser: (id) => axiosInstance.post(`/admin/reject/${id}`),
  grantGlobal: (id) => axiosInstance.post(`/admin/grant-global/${id}`),
  revokeGlobal: (id) => axiosInstance.post(`/admin/revoke-global/${id}`),
  getJobs: () => axiosInstance.get('/admin/jobs'),
  createJob: (data) => axiosInstance.post('/admin/jobs', data),
  adminDownloadGlobal: (jobId) => axiosInstance.get(`/admin/download-global/${jobId}`, { responseType: 'blob' })
}

import axiosInstance from './axiosInstance'

export const schemaApi = {
  createSchema: (data) => axiosInstance.post('/schema/create', data),
  getAllSchemas: () => axiosInstance.get('/schema/'),
  getSchema: (docType) => axiosInstance.get(`/schema/${docType}`),
}

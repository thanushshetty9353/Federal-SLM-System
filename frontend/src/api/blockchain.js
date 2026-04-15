import axiosInstance from './axiosInstance'

export const blockchainApi = {
  getAuditTrail: () => axiosInstance.get('/blockchain/audit'),
}

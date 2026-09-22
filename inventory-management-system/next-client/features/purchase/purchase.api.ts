import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/types';

interface IPurchase {}

const purchaseApi = {
  getAll: async (): Promise<ApiResponse<IPurchase[]>> => {
    const res = await apiClient.get<ApiResponse<IPurchase[]>>('/purchases');
    return res.data;
  },

  create: async (data: Partial<IPurchase>): Promise<ApiResponse<IPurchase>> => {
    const res = await apiClient.post<ApiResponse<IPurchase>>('/purchases', data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/purchases/${id}`);
    return res.data;
  },
};

export default purchaseApi;

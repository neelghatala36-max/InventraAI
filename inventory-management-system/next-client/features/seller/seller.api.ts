import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/types';

interface ISeller {}

const sellerApi = {
  getAll: async (): Promise<ApiResponse<ISeller[]>> => {
    const res = await apiClient.get<ApiResponse<ISeller[]>>('/sellers');
    return res.data;
  },

  create: async (data: Partial<ISeller>): Promise<ApiResponse<ISeller>> => {
    const res = await apiClient.post<ApiResponse<ISeller>>('/sellers', data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/sellers/${id}`);
    return res.data;
  },
};

export default sellerApi;

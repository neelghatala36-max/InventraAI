import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/types';
import { IBrand } from './brand.types';

const brandApi = {
  getAll: async (): Promise<ApiResponse<IBrand[]>> => {
    const res = await apiClient.get<ApiResponse<IBrand[]>>('/brands');
    return res.data;
  },

  create: async (data: Partial<IBrand>): Promise<ApiResponse<IBrand>> => {
    const res = await apiClient.post<ApiResponse<IBrand>>('/brands', data);
    return res.data;
  },
};

export default brandApi;

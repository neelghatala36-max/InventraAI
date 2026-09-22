import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/types';

interface ICategory {}

const categoryApi = {
  getAll: async (): Promise<ApiResponse<ICategory[]>> => {
    const res = await apiClient.get<ApiResponse<ICategory[]>>('/categories');
    return res.data;
  },

  create: async (data: Partial<ICategory>): Promise<ApiResponse<ICategory>> => {
    const res = await apiClient.post<ApiResponse<ICategory>>('/categories', data);
    return res.data;
  },
};

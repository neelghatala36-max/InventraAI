import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/types';

interface IProduct {}

const productApi = {
  getAll: async (): Promise<ApiResponse<IProduct[]>> => {
    const res = await apiClient.get<ApiResponse<IProduct[]>>('/products');
    return res.data;
  },

  create: async (data: Partial<IProduct>): Promise<ApiResponse<IProduct>> => {
    const res = await apiClient.post<ApiResponse<IProduct>>('/products', data);
    return res.data;
  },

  update: async (id: string, data: Partial<IProduct>): Promise<ApiResponse<IProduct>> => {
    const res = await apiClient.patch<ApiResponse<IProduct>>(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/products/${id}`);
    return res.data;
  },

  bulkDelete: async (ids: string[]): Promise<ApiResponse<null>> => {
    const res = await apiClient.post<ApiResponse<null>>('/products/bulk-delete', { ids });
    return res.data;
  },

  addStock: async (id: string, quantity: number): Promise<ApiResponse<IProduct>> => {
    const res = await apiClient.patch<ApiResponse<IProduct>>(`/products/${id}/add`, { quantity });
    return res.data;
  },
};

export default productApi;

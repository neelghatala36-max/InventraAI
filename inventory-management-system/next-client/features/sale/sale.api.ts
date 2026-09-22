import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/types';

interface ISale {}

const saleApi = {
  getAll: async (): Promise<ApiResponse<ISale[]>> => {
    const res = await apiClient.get<ApiResponse<ISale[]>>('/sales');
    return res.data;
  },

  create: async (data: Partial<ISale>): Promise<ApiResponse<ISale>> => {
    const res = await apiClient.post<ApiResponse<ISale>>('/sales', data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/sales/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<ISale>): Promise<ApiResponse<ISale>> => {
    const res = await apiClient.patch<ApiResponse<ISale>>(`/sales/${id}`, data);
    return res.data;
  },

  yearlySale: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/sales/years`);
    return res.data;
  },

  monthlySale: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/sales/months`);
    return res.data;
  },

  weeklySale: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/sales/weeks`);
    return res.data;
  },

  dailySale: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/sales/days`);
    return res.data;
  },
};

export default saleApi;

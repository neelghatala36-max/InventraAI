'use client';

import apiClient from '@/lib/apiClient';
import { ApiResponse, IUser } from '@/types';
import { AuthResponse, ILoginInput, IRegisterInput } from './auth.types';

export const authApi = {
  login: async (data: ILoginInput): Promise<ApiResponse<AuthResponse>> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/users/login', data);
    console.log(res);
    return res.data;
  },

  register: async (data: IRegisterInput): Promise<ApiResponse<AuthResponse>> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/users/register', data);
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<IUser>> => {
    const res = await apiClient.get<ApiResponse<IUser>>('/auth/profile');
    return res.data;
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<ApiResponse<IUser>> => {
    const res = await apiClient.put<ApiResponse<IUser>>('/auth/profile', data);
    return res.data;
  },
};

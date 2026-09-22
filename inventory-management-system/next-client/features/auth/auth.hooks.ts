'use client';

import { storeAccessToken } from '@/actions';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { ILoginInput, IRegisterInput } from './auth.types';
import { toast } from 'sonner';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ILoginInput) => authApi.login(data),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token);
        await storeAccessToken(response.data.token);

        queryClient.setQueryData(['user'], response.data.user);
        toast.success('Login successful!');
      }
    },
    onError: (error) => {
      toast.error(error?.message ? error.message : 'Failed to login!!!');
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IRegisterInput) => authApi.register(data),

    onSuccess: async (response) => {
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token);
        await storeAccessToken(response.data.token);

        queryClient.setQueryData(['user'], response.data.user);
      }
    },
    onError: (error) => {
      toast.error(error?.message ? error.message : 'Failed to register!!!');
    },
  });
}

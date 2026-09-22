'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { Toaster } from './ui/sonner';

const defaultOptions = {
  queries: { retry: 1, refetchOnWindowFocus: false },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions }));

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      storageKey='restaurant-pos-theme'
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position='top-right' richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

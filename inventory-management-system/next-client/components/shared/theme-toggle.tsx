'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { DropdownMenuItem } from '../ui/dropdown-menu';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
        {resolvedTheme === 'dark' ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
        {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
      {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode
    </DropdownMenuItem>
  );
}

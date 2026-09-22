'use client';

import { useAuthStore } from '@/store/authStore';
import { LucideIcon, MailIcon, MapPinCheckIcon, PhoneIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className='flex items-center justify-center'>
      <div className='w-full rounded-2xl'>
        <div
          className='h-28 w-full relative'
          style={{
            background:
              'linear-gradient(120deg, #1a1a2e 0%, #16213e 30%, #0f3460 55%, #e94560 80%, #f5a623 100%)',
          }}
        >
          <div className='absolute inset-0 overflow-hidden rounded-md'>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className='absolute'
                style={{
                  left: `${10 + i * 9}%`,
                  top: '-20%',
                  width: '3px',
                  height: '160%',
                  background: `rgba(255,255,255,${0.03 + (i % 3) * 0.04})`,
                  transform: `rotate(${25 + i * 2}deg)`,
                  transformOrigin: 'top left',
                }}
              />
            ))}
          </div>
        </div>

        <div className='px-6 pb-0 relative'>
          <div className='absolute -top-10 left-6'>
            <div className='w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-amber-100 flex items-center justify-center text-4xl'>
              😎
            </div>
          </div>

          <div className='flex items-end justify-between pt-3 pb-4'>
            <div className='ml-24'>
              <h2 className='text-lg font-bold text-foreground leading-tight'>{user?.name}</h2>
              <p className='text-sm text-gray-400 font-medium'>{user?.role}</p>
            </div>
          </div>
        </div>

        <div className='h-px bg-foreground/20 mx-6' />

        <div className='flex gap-6 px-6 py-5 '>
          <div className='w-1/4 bg-foreground/10 rounded-lg p-6'>
            <h3 className='text-sm font-semibold text-foreground mb-4'>Info</h3>
            <div className='space-y-4'>
              <InfoItem IconComponent={MailIcon} label='Email' value={user?.email || 'N/A'} />
              <InfoItem IconComponent={PhoneIcon} label='Phone' value={user?.phone || 'N/A'} />
              <InfoItem
                IconComponent={MapPinCheckIcon}
                label='Location'
                value={user?.address || 'N/A'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  IconComponent: LucideIcon;
  label: string;
  value: string;
}

const InfoItem = ({ IconComponent, label, value }: InfoItemProps) => {
  return (
    <div className='flex items-start gap-2.5'>
      <div className='w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-0.5'>
        <IconComponent className='text-background w-4' />
      </div>
      <div>
        <p className='text-[10px] text-foreground/70 uppercase tracking-wide font-semibold'>
          {label}
        </p>
        <p className='text-xs text-foreground font-medium leading-relaxed'>{value}</p>
      </div>
    </div>
  );
};

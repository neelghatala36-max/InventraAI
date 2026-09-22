'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { IRegisterInput } from '@/features/auth/auth.types';
import { useRegister } from '@/features/auth/auth.hooks';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const handleRegisterMutation = useRegister();
  const router = useRouter();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: IRegisterInput) => {
    await handleRegisterMutation.mutateAsync(data);
    router.refresh();
  };

  return (
    <div className={cn('flex flex-col gap-6')}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form onSubmit={handleSubmit(onSubmit)} className='p-6 md:p-8'>
            <FieldGroup className='gap-3'>
              <div className='flex flex-col items-center gap-2 text-center'>
                <h1 className='text-2xl font-bold'>Create your account</h1>
                <p className='text-muted-foreground text-sm text-balance'>
                  Enter your email below to create your account
                </p>
              </div>
              <Field className='gap-1'>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  {...register('email', { required: true })}
                />
              </Field>
              <Field className='gap-1'>
                <FieldLabel htmlFor='name'>Name</FieldLabel>
                <Input
                  id='name'
                  placeholder='Your name'
                  {...register('name', { required: true })}
                />
              </Field>

              <Field className='gap-1'>
                <FieldLabel htmlFor='password'>Password</FieldLabel>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter your password'
                  {...register('password', { required: true })}
                />
              </Field>

              <Field className='gap-1'>
                <FieldLabel htmlFor='confirm-password'>Confirm Password</FieldLabel>
                <Input
                  id='confirm-password'
                  type='password'
                  placeholder='Confirm your password'
                  {...register('confirmPassword', { required: true })}
                />
              </Field>

              <FieldDescription>Must be at least 8 characters long.</FieldDescription>

              <Field>
                <Button type='submit'>Create Account</Button>
              </Field>

              <FieldDescription className='text-center'>
                Already have an account? <Link href='/login'>Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className='bg-muted border-l border-gray-200 relative hidden md:block'>
            <Image
              src='/auth.jpg'
              alt='Image'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
              width={500}
              height={500}
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className='px-6 text-center'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a> and{' '}
        <a href='#'>Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}

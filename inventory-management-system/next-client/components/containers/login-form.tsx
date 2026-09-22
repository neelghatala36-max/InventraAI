'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/features/auth/auth.hooks';
import { ILoginInput } from '@/features/auth/auth.types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

const LoginForm = () => {
  const handleLoginMutation = useLogin();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@example.com',
      password: 'pass1234',
    },
  });

  const onSubmit = async (data: ILoginInput) => {
    await handleLoginMutation.mutateAsync(data);
    router.refresh();
  };

  return (
    <div className={cn('flex flex-col gap-6')}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form onSubmit={handleSubmit(onSubmit)} className='p-6 md:p-8'>
            <FieldGroup>
              <div className='flex flex-col items-center gap-2 text-center'>
                <h1 className='text-2xl font-bold'>Welcome back</h1>
                <p className='text-muted-foreground text-balance'>Login to your account</p>
              </div>
              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  {...register('email', {
                    required: true,
                  })}
                />
                {errors.email && (
                  <FieldDescription className='text-red-500'>
                    This field is required
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <div className='flex items-center'>
                  <FieldLabel htmlFor='password'>Password</FieldLabel>
                </div>
                <Input
                  id='password'
                  type='password'
                  {...register('password', { required: true })}
                />
                {errors.password && (
                  <FieldDescription className='text-red-500'>
                    This field is required
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type='submit' disabled={handleLoginMutation.isPending}>
                  Login
                </Button>
              </Field>

              <FieldDescription className='text-center'>
                Don&apos;t have an account? <Link href='/register'>Sign up</Link>
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
};

export default LoginForm;

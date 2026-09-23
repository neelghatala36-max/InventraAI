import { useState, useEffect } from 'react';
import { Button, Flex, Card, Typography, Tooltip } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { SpinnerIcon } from '@phosphor-icons/react';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useLoginMutation } from '../../redux/features/authApi';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getCurrentUser, loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import Logo from '../../components/layout/Logo';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userLogin, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(getCurrentUser);

  // If already authenticated and token valid, redirect to home
  useEffect(() => {
    if (currentUser && (!currentUser.exp || currentUser.exp * 1000 > Date.now())) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'neelghantala@gmail.com',
      password: 'Neel123',
    },
  });

  const setDemoCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      const cleanData = {
        email: data.email?.trim(),
        password: data.password,
      };

      const res = await userLogin(cleanData).unwrap();

      if (res.statusCode === 200 || res.success) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toastMessage({ icon: 'success', text: 'Welcome back! Login successful.' });
      }
    } catch (error: any) {
      let errMsg = 'Invalid email or password';
      if (error?.data?.errors && typeof error.data.errors === 'object') {
        const keys = Object.keys(error.data.errors);
        if (keys.length > 0) {
          errMsg = String(error.data.errors[keys[0]]);
        }
      } else if (error?.data?.message) {
        errMsg = error.data.message === 'WrongCredentials' ? 'Invalid email or password' : error.data.message;
      } else if (error?.error) {
        errMsg = error.error;
      }
      toastMessage({ icon: 'error', text: errMsg });
    }
  };

  return (
    <Flex justify='center' align='center' className='auth-page-container' style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '16px',
          boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.12), 0 8px 15px -6px rgba(0, 0, 0, 0.08)',
          border: 'none',
        }}
      >
        <Flex vertical align='center' style={{ marginBottom: '1.75rem' }}>
          <Logo size={42} />
          <Text
            type='secondary'
            style={{ marginTop: '0.6rem', fontSize: '0.9rem', fontWeight: 500, textAlign: 'center' }}
          >
            Smart Inventory Management, Powered by AI
          </Text>
        </Flex>

        <Title level={3} style={{ marginBottom: '1.25rem', textAlign: 'center', fontWeight: 700 }}>
          Welcome Back
        </Title>

        {/* Quick Demo Credentials Banner */}
        <div
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px dashed rgba(37, 99, 235, 0.35)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '1.25rem',
          }}
        >
          <Flex justify='space-between' align='center' wrap='wrap' gap={6}>
            <Text style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ThunderboltOutlined /> Demo Accounts:
            </Text>
            <Flex gap={6}>
              <Tooltip title="Populate Primary Account (Preloaded with sample data)">
                <Button
                  size='small'
                  type='link'
                  onClick={() => setDemoCredentials('neelghantala@gmail.com', 'Neel123')}
                  style={{ fontSize: '0.8rem', padding: '0 6px', height: '24px', fontWeight: 600 }}
                >
                  Admin Demo
                </Button>
              </Tooltip>
              <span style={{ color: '#94A3B8' }}>|</span>
              <Tooltip title="Populate Demo Visitor Account">
                <Button
                  size='small'
                  type='link'
                  onClick={() => setDemoCredentials('test-visitor@gmail.com', 'pass123')}
                  style={{ fontSize: '0.8rem', padding: '0 6px', height: '24px', fontWeight: 600 }}
                >
                  Visitor Demo
                </Button>
              </Tooltip>
            </Flex>
          </Flex>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1.1rem' }}>
            <label className='label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserOutlined style={{ fontSize: '0.85rem' }} /> Email Address
            </label>
            <input
              type='email'
              {...register('email', { 
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              placeholder='Enter your email address'
              className={`input-field ${errors['email'] ? 'input-field-error' : ''}`}
            />
            {errors['email'] && (
              <span style={{ color: '#EF4444', fontSize: '0.8rem', display: 'block', marginTop: '-4px' }}>
                {String(errors['email'].message)}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className='label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LockOutlined style={{ fontSize: '0.85rem' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
                style={{ paddingRight: '40px', marginBottom: 0 }}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeInvisibleOutlined style={{ fontSize: '1.1rem' }} /> : <EyeOutlined style={{ fontSize: '1.1rem' }} />}
              </button>
            </div>
            {errors['password'] && (
              <span style={{ color: '#EF4444', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                {String(errors['password'].message)}
              </span>
            )}
          </div>
          
          <Button
            htmlType='submit'
            type='primary'
            size='large'
            disabled={isLoading}
            style={{ 
              width: '100%', 
              height: '46px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? <SpinnerIcon className='spin' weight='bold' style={{ fontSize: '1.2rem' }} /> : null}
            Sign In
          </Button>
        </form>

        <Text style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', fontSize: '0.92rem' }}>
          Don't have an account? <Link to='/register' style={{ color: '#2563EB', fontWeight: 600 }}>Create Account</Link>
        </Text>
      </Card>
    </Flex>
  );
};

export default LoginPage;

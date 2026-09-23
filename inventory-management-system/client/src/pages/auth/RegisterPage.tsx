import { useState, useEffect } from 'react';
import { SpinnerIcon } from '@phosphor-icons/react';
import { Button, Flex, Card, Typography } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getCurrentUser, loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import Logo from '../../components/layout/Logo';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(getCurrentUser);
  const [userRegistration, { isLoading }] = useRegisterMutation();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (currentUser && (!currentUser.exp || currentUser.exp * 1000 > Date.now())) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm();

  const passwordVal = watch('password');

  const onSubmit = async (data: FieldValues) => {
    try {
      if (data.password !== data.confirmPassword) {
        toastMessage({ icon: 'error', text: 'Password and confirm password must match!' });
        return;
      }

      const payload = {
        name: data.name?.trim(),
        email: data.email?.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      const res = await userRegistration(payload).unwrap();

      if (res.statusCode === 201 || res.success) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toastMessage({ icon: 'success', text: 'Account created successfully! Welcome to InventraAI.' });
      }
    } catch (error: any) {
      let errMsg = 'Failed to create account. Please try again.';
      if (error?.data?.errors && typeof error.data.errors === 'object') {
        const keys = Object.keys(error.data.errors);
        if (keys.length > 0) {
          errMsg = String(error.data.errors[keys[0]]);
        }
      } else if (error?.data?.message) {
        errMsg = error.data.message;
      } else if (error?.error) {
        errMsg = error.error;
      }
      toastMessage({ icon: 'error', text: errMsg });
    }
  };

  return (
    <Flex justify='center' align='center' className='auth-page-container' style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '460px',
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

        <Title level={3} style={{ marginBottom: '1.5rem', textAlign: 'center', fontWeight: 700 }}>
          Create Account
        </Title>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1rem' }}>
            <label className='label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserOutlined style={{ fontSize: '0.85rem' }} /> Full Name
            </label>
            <input
              type='text'
              {...register('name', { 
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must have at least 2 characters' }
              })}
              placeholder='Enter your full name'
              className={`input-field ${errors['name'] ? 'input-field-error' : ''}`}
            />
            {errors['name'] && (
              <span style={{ color: '#EF4444', fontSize: '0.8rem', display: 'block', marginTop: '-4px' }}>
                {String(errors['name'].message)}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className='label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MailOutlined style={{ fontSize: '0.85rem' }} /> Email Address
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

          <div style={{ marginBottom: '1rem' }}>
            <label className='label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LockOutlined style={{ fontSize: '0.85rem' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Create a strong password (min 6 chars)'
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
                style={{ paddingRight: '40px', marginBottom: 0 }}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label className='label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LockOutlined style={{ fontSize: '0.85rem' }} /> Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Re-type your password'
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (val) => val === passwordVal || 'Passwords do not match'
                })}
                className={`input-field ${errors['confirmPassword'] ? 'input-field-error' : ''}`}
                style={{ paddingRight: '40px', marginBottom: 0 }}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
                {showConfirmPassword ? <EyeInvisibleOutlined style={{ fontSize: '1.1rem' }} /> : <EyeOutlined style={{ fontSize: '1.1rem' }} />}
              </button>
            </div>
            {errors['confirmPassword'] && (
              <span style={{ color: '#EF4444', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                {String(errors['confirmPassword'].message)}
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
            Get Started
          </Button>
        </form>

        <Text style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', fontSize: '0.92rem' }}>
          Already have an account? <Link to='/login' style={{ color: '#2563EB', fontWeight: 600 }}>Sign In</Link>
        </Text>
      </Card>
    </Flex>
  );
};

export default RegisterPage;

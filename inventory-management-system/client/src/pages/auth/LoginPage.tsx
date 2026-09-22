import { SpinnerIcon } from '@phosphor-icons/react';
import { Button, Flex, Card, Typography } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useLoginMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import Logo from '../../components/layout/Logo';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [userLogin, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'test-visitor@gmail.com',
      password: 'pass123',
    },
  });

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await userLogin(data).unwrap();

      if (res.statusCode === 200) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toastMessage({ icon: 'success', text: 'Successfully Login!' });
      }
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.error || 'An unexpected error occurred';
      toastMessage({ icon: 'error', text: errMsg });
    }
  };

  return (
    <Flex justify='center' align='center' className='auth-page-container'>
      <Card
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: 'none',
        }}
      >
        <Flex vertical align='center' style={{ marginBottom: '2rem' }}>
          <Logo size={40} />
          <Text
            type='secondary'
            style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}
          >
            Smart Inventory Management, Powered by AI
          </Text>
        </Flex>

        <Title level={3} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Welcome Back
        </Title>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1rem' }}>
            <label className='label'>Email Address</label>
            <input
              type='text'
              {...register('email', { required: true })}
              placeholder='Enter your email'
              className={`input-field ${errors['email'] ? 'input-field-error' : ''}`}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className='label'>Password</label>
            <input
              type='password'
              placeholder='Enter your password'
              className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
              {...register('password', { required: true })}
            />
          </div>
          
          <Button
            htmlType='submit'
            type='primary'
            size='large'
            disabled={isLoading}
            style={{ 
              width: '100%', 
              height: '45px',
              fontSize: '1rem',
              borderRadius: '8px'
            }}
          >
            {isLoading && <SpinnerIcon className='spin' weight='bold' style={{ marginRight: '8px' }} />}
            Sign In
          </Button>
        </form>

        <Text style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center' }}>
          Don't have an account? <Link to='/register' style={{ color: '#2563EB', fontWeight: 600 }}>Create Account</Link>
        </Text>
      </Card>
    </Flex>
  );
};

export default LoginPage;

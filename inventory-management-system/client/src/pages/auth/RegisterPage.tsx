import { SpinnerIcon } from '@phosphor-icons/react';
import { Button, Flex, Card, Typography } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import Logo from '../../components/layout/Logo';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userRegistration, { isLoading }] = useRegisterMutation();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: FieldValues) => {
    try {
      if (data.password !== data.confirmPassword) {
        toastMessage({ icon: 'error', text: 'Password and confirm password must be same!' });
        return;
      }

      const res = await userRegistration(data).unwrap();

      if (res.statusCode === 201) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toastMessage({ icon: 'success', text: res.message });
      }
    } catch (error: any) {
      let errMsg = 'An unexpected error occurred';
      if (error?.data?.errors) {
        const keys = Object.keys(error.data.errors);
        if (keys.length > 0) {
          errMsg = error.data.errors[keys[0]];
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
    <Flex justify='center' align='center' className='auth-page-container' style={{ padding: '2rem 0' }}>
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
          Create Account
        </Title>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1rem' }}>
            <label className='label'>Full Name</label>
            <input
              type='text'
              {...register('name', { required: true })}
              placeholder='Enter your full name'
              className={`input-field ${errors['name'] ? 'input-field-error' : ''}`}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className='label'>Email Address</label>
            <input
              type='text'
              {...register('email', { required: true })}
              placeholder='Enter your email'
              className={`input-field ${errors['email'] ? 'input-field-error' : ''}`}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className='label'>Password</label>
            <input
              type='password'
              placeholder='Create a password'
              {...register('password', { required: true })}
              className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className='label'>Confirm Password</label>
            <input
              type='password'
              placeholder='Confirm your password'
              {...register('confirmPassword', { required: true })}
              className={`input-field ${errors['confirmPassword'] ? 'input-field-error' : ''}`}
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
            Get Started
          </Button>
        </form>

        <Text style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center' }}>
          Already have an account? <Link to='/login' style={{ color: '#2563EB', fontWeight: 600 }}>Sign In</Link>
        </Text>
      </Card>
    </Flex>
  );
};

export default RegisterPage;

import { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getCurrentUser, logoutUser } from '../../redux/services/authSlice';
import { Navigate } from 'react-router-dom';

const ProtectRoute = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector(getCurrentUser);
  const dispatch = useAppDispatch();

  if (!user) {
    return <Navigate to='/login' replace={true} />;
  }

  // Check if token has expired
  if (user.exp && user.exp * 1000 < Date.now()) {
    dispatch(logoutUser());
    return <Navigate to='/login' replace={true} />;
  }

  return <>{children}</>;
};

export default ProtectRoute;

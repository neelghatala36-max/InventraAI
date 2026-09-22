import { IUser } from '@/types';

export interface AuthResponse {
  user: IUser;
  token: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

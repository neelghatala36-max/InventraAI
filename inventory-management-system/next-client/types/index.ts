export type TUserRole = 'ADMIN' | 'USER';
export type TUserStatus = 'PENDING' | 'ACTIVE' | 'BLOCK';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  title?: string;
  description?: string;
  role: TUserRole;
  avatar?: string;
  password: string;
  status: TUserStatus;
  address?: string;
  phone?: string;
  city?: string;
  country?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

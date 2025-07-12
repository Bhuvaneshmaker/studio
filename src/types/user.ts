
export type UserRole = 'Admin' | 'User';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
}

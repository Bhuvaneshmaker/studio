
export type UserRole = 'Admin' | 'User';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

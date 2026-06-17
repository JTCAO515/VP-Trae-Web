import type { UserRole, UserStatus } from '@visepanda/shared-types';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleEntity {
  userId: string;
  roleId: string;
  roleCode: UserRole;
  createdAt: Date;
}

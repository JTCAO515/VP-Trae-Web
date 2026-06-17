import type { UserRole } from '@visepanda/shared-types';

export interface RoleEntity {
  id: string;
  code: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

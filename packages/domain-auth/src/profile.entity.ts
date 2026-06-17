export interface ProfileEntity {
  userId: string;
  displayName: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

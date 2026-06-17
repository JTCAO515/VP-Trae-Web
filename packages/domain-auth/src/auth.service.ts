import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import type {
  AuthSessionPayload,
  AuthTokenPayload,
  AuthTokenPurpose,
  EmailVerificationResultPayload,
  PasswordResetResultPayload,
  SessionVerificationPayload,
  UserRole,
  UserStatus,
} from '@visepanda/shared-types';

import type { ProfileEntity } from './profile.entity';
import type { RoleEntity } from './role.entity';
import type { SessionEntity } from './session.entity';
import type { UserEntity, UserRoleEntity } from './user.entity';

interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface PlaceholderTokenRecord {
  token: string;
  purpose: AuthTokenPurpose;
  userId: string;
  tokenStatus: 'pending' | 'used';
  createdAt: Date;
  updatedAt: Date;
  usedAt: Date | null;
}

const SESSION_TTL_SECONDS = 60 * 60;

@Injectable()
export class AuthService {
  private readonly users = new Map<string, UserEntity>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly roles = new Map<string, RoleEntity>();
  private readonly rolesByCode = new Map<UserRole, RoleEntity>();
  private readonly userRoles = new Map<string, UserRoleEntity>();
  private readonly profiles = new Map<string, ProfileEntity>();
  private readonly sessions = new Map<string, SessionEntity>();
  private readonly sessionsByAccessToken = new Map<string, string>();
  private readonly tokens = new Map<string, PlaceholderTokenRecord>();

  constructor() {
    this.seedRoles();
    this.seedDefaultBackofficeUsers();
  }

  register(input: RegisterInput): AuthSessionPayload {
    const email = this.normalizeEmail(input.email);

    if (this.usersByEmail.has(email)) {
      throw new BadRequestException('Email already registered');
    }

    const now = new Date();
    const userId = randomUUID();
    const role = this.getRole('traveler');
    const user: UserEntity = {
      id: userId,
      email,
      passwordHash: this.hashValue(input.password),
      status: 'active',
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const userRole: UserRoleEntity = {
      userId,
      roleId: role.id,
      roleCode: role.code,
      createdAt: now,
    };

    const profile: ProfileEntity = {
      userId,
      displayName: input.displayName?.trim() || null,
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(userId, user);
    this.usersByEmail.set(email, userId);
    this.userRoles.set(userId, userRole);
    this.profiles.set(userId, profile);

    const session = this.createSession(userId, now);
    return this.toAuthSessionPayload(user, session);
  }

  login(input: LoginInput): AuthSessionPayload {
    const email = this.normalizeEmail(input.email);
    const userId = this.usersByEmail.get(email);

    if (!userId) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = this.getUser(userId);

    if (user.passwordHash !== this.hashValue(input.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'disabled') {
      throw new UnauthorizedException('User is disabled');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    const now = new Date();
    user.lastLoginAt = now;
    user.updatedAt = now;

    const session = this.createSession(user.id, now);
    return this.toAuthSessionPayload(user, session);
  }

  logout(authorization?: string): { loggedOut: true } {
    const session = this.resolveActiveSession(authorization);
    const now = new Date();

    session.status = 'revoked';
    session.revokedAt = now;
    session.updatedAt = now;
    this.sessionsByAccessToken.delete(session.accessToken);

    return { loggedOut: true };
  }

  verifySession(authorization?: string): SessionVerificationPayload {
    const session = this.resolveActiveSession(authorization);
    const user = this.getUser(session.userId);

    if (user.status !== 'active') {
      throw new UnauthorizedException('Session is invalid');
    }

    session.lastSeenAt = new Date();

    return {
      isValid: true,
      sessionId: session.id,
      user: this.toUserPayload(user),
    };
  }

  requestEmailVerification(email: string): AuthTokenPayload {
    const user = this.findUserByEmail(email);
    const token = this.createToken(user.id, 'email_verification');

    return {
      purpose: token.purpose,
      token: token.token,
      tokenStatus: token.tokenStatus,
    };
  }

  confirmEmailVerification(token: string): EmailVerificationResultPayload {
    const record = this.consumeToken(token, 'email_verification');
    const profile = this.getProfile(record.userId);
    const now = new Date();

    profile.emailVerifiedAt = now;
    profile.updatedAt = now;

    return {
      verified: true,
      tokenStatus: 'used',
    };
  }

  requestPasswordReset(email: string): AuthTokenPayload {
    const user = this.findUserByEmail(email);
    const token = this.createToken(user.id, 'password_reset');

    return {
      purpose: token.purpose,
      token: token.token,
      tokenStatus: token.tokenStatus,
    };
  }

  confirmPasswordReset(token: string, newPassword: string): PasswordResetResultPayload {
    const record = this.consumeToken(token, 'password_reset');
    const user = this.getUser(record.userId);
    const now = new Date();

    user.passwordHash = this.hashValue(newPassword);
    user.updatedAt = now;

    return {
      passwordReset: true,
      tokenStatus: 'used',
    };
  }

  updateUserStatus(userId: string, status: UserStatus): void {
    const user = this.getUser(userId);
    user.status = status;
    user.updatedAt = new Date();
  }

  private createSession(userId: string, now: Date): SessionEntity {
    const accessToken = `at_${randomUUID()}`;
    const refreshToken = `rt_${randomUUID()}`;
    const session: SessionEntity = {
      id: randomUUID(),
      userId,
      accessToken,
      accessTokenHash: this.hashValue(accessToken),
      refreshToken,
      refreshTokenHash: this.hashValue(refreshToken),
      status: 'active',
      expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
    };

    this.sessions.set(session.id, session);
    this.sessionsByAccessToken.set(accessToken, session.id);

    return session;
  }

  private resolveActiveSession(authorization?: string): SessionEntity {
    const accessToken = this.resolveBearerToken(authorization);

    if (!accessToken) {
      throw new UnauthorizedException('Session is invalid');
    }

    const sessionId = this.sessionsByAccessToken.get(accessToken);
    const session = sessionId ? this.sessions.get(sessionId) : undefined;

    if (!session) {
      throw new UnauthorizedException('Session is invalid');
    }

    if (session.status !== 'active' || session.expiresAt.getTime() <= Date.now()) {
      this.sessionsByAccessToken.delete(accessToken);
      throw new UnauthorizedException('Session is invalid');
    }

    return session;
  }

  private createToken(userId: string, purpose: AuthTokenPurpose): PlaceholderTokenRecord {
    const now = new Date();
    const record: PlaceholderTokenRecord = {
      token: `${purpose}_${randomUUID()}`,
      purpose,
      userId,
      tokenStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      usedAt: null,
    };

    this.tokens.set(record.token, record);
    return record;
  }

  private consumeToken(token: string, purpose: AuthTokenPurpose): PlaceholderTokenRecord {
    const record = this.tokens.get(token);

    if (!record || record.purpose !== purpose || record.tokenStatus !== 'pending') {
      throw new BadRequestException('Token is invalid');
    }

    const now = new Date();
    record.tokenStatus = 'used';
    record.usedAt = now;
    record.updatedAt = now;

    return record;
  }

  private toAuthSessionPayload(user: UserEntity, session: SessionEntity): AuthSessionPayload {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: SESSION_TTL_SECONDS,
      sessionId: session.id,
      user: this.toUserPayload(user),
    };
  }

  private toUserPayload(user: UserEntity): {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  } {
    return {
      id: user.id,
      email: user.email,
      role: this.userRoles.get(user.id)?.roleCode ?? 'traveler',
      status: user.status,
    };
  }

  private findUserByEmail(email: string): UserEntity {
    const userId = this.usersByEmail.get(this.normalizeEmail(email));

    if (!userId) {
      throw new BadRequestException('User not found');
    }

    return this.getUser(userId);
  }

  private getUser(userId: string): UserEntity {
    const user = this.users.get(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private getProfile(userId: string): ProfileEntity {
    const profile = this.profiles.get(userId);

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    return profile;
  }

  private getRole(roleCode: UserRole): RoleEntity {
    const role = this.rolesByCode.get(roleCode);

    if (!role) {
      throw new BadRequestException(`Role ${roleCode} not found`);
    }

    return role;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private resolveBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
      return null;
    }

    return token.trim();
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private seedRoles(): void {
    const now = new Date();

    this.addRole({
      id: randomUUID(),
      code: 'traveler',
      name: 'Traveler',
      createdAt: now,
      updatedAt: now,
    });
    this.addRole({
      id: randomUUID(),
      code: 'operator',
      name: 'Operator',
      createdAt: now,
      updatedAt: now,
    });
    this.addRole({
      id: randomUUID(),
      code: 'admin',
      name: 'Admin',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 为后台 MVP 提供可直接登录的默认账号（纯内存态，重启即丢失）。
   *
   * 说明：
   * - 该实现仅用于本地开发 / MVP 验证，真实环境应改为数据库种子数据或管理员创建流程
   * - 密码仅用于开发演示，不应在生产中硬编码
   */
  private seedDefaultBackofficeUsers(): void {
    const now = new Date();
    this.createSeedUser({
      email: 'operator@visepanda.local',
      password: 'Operator123!',
      role: 'operator',
      now,
    });
    this.createSeedUser({
      email: 'admin@visepanda.local',
      password: 'Admin123!',
      role: 'admin',
      now,
    });
  }

  private createSeedUser(input: { email: string; password: string; role: UserRole; now: Date }): void {
    const email = this.normalizeEmail(input.email);
    if (this.usersByEmail.has(email)) {
      return;
    }

    const role = this.getRole(input.role);
    const userId = randomUUID();
    const user: UserEntity = {
      id: userId,
      email,
      passwordHash: this.hashValue(input.password),
      status: 'active',
      lastLoginAt: input.now,
      createdAt: input.now,
      updatedAt: input.now,
    };

    const userRole: UserRoleEntity = {
      userId,
      roleId: role.id,
      roleCode: role.code,
      createdAt: input.now,
    };

    const profile: ProfileEntity = {
      userId,
      displayName: null,
      emailVerifiedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    };

    this.users.set(userId, user);
    this.usersByEmail.set(email, userId);
    this.userRoles.set(userId, userRole);
    this.profiles.set(userId, profile);
  }

  private addRole(role: RoleEntity): void {
    this.roles.set(role.id, role);
    this.rolesByCode.set(role.code, role);
  }
}

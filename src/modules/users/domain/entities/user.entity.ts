import { InvalidUserNameError } from '../errors/invalid-user-name.error.js';
import { UserRole } from '../enums/user-role.enum.js';
import { UserStatus } from '../enums/user-status.enum.js';
import type { Email } from '../value-objects/email.vo.js';
import type { UserId } from '../value-objects/user-id.vo.js';

export interface CreateUserProps {
  id: UserId;
  email: Email;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  now: Date;
}

export interface RehydrateUserProps {
  id: UserId;
  email: Email;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(
    readonly id: UserId,
    private _email: Email,
    readonly passwordHash: string,
    private _name: string,
    readonly role: UserRole,
    private _status: UserStatus,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateUserProps): User {
    const name = User.normalizeName(props.name);
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      name,
      props.role,
      props.status,
      new Date(props.now),
      new Date(props.now),
    );
  }

  static rehydrate(props: RehydrateUserProps): User {
    const name = User.normalizeName(props.name);
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      name,
      props.role,
      props.status,
      new Date(props.createdAt),
      new Date(props.updatedAt),
    );
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get status(): UserStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  changeEmail(email: Email, now: Date): void {
    this._email = email;
    this.touch(now);
  }

  rename(name: string, now: Date): void {
    this._name = User.normalizeName(name);
    this.touch(now);
  }

  changeStatus(status: UserStatus, now: Date): void {
    this._status = status;
    this.touch(now);
  }

  private static normalizeName(name: string): string {
    const normalized = name.trim();
    if (normalized.length === 0 || normalized.length > 120) {
      throw new InvalidUserNameError();
    }
    return normalized;
  }

  private touch(now: Date): void {
    this._updatedAt = new Date(now);
  }
}

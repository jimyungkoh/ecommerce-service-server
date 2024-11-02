import { User } from '@prisma/client';

export type UserDomainProps = {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserDomain {
  constructor(private readonly props: UserDomainProps) {}

  get id(): number {
    return this.props.id;
  }

  get password(): string {
    return this.props.password;
  }

  get email(): string {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(user: User): UserDomain {
    return new UserDomain(user);
  }
}

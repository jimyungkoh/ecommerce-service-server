import { User } from '@prisma/client';

export type UserModelProps = {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserModel {
  readonly id: number;
  readonly email: string;
  readonly password: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserModelProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(user: User): UserModel {
    return new UserModel(user);
  }
}

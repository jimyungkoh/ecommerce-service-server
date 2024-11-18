import { UserModel } from 'src/domain/models';

export type UserInfoProps = Omit<UserModel, 'password'>;

export class UserInfo {
  readonly id: number;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserInfoProps) {
    this.id = props.id;
    this.email = props.email;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(domain: UserModel): UserInfo {
    return new UserInfo({
      id: domain.id,
      email: domain.email,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}

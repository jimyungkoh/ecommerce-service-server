import { UserModel } from 'src/domain/models';
import { InfoDTO } from '../info';

export type UserInfoProps = Omit<UserModel, 'password'>;

export class UserInfo extends InfoDTO<UserInfoProps> {
  constructor(props: UserInfoProps) {
    super(props);
  }

  get id(): number {
    return this.props.id;
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

  static from(domain: UserModel): UserInfo {
    const { id, email, createdAt, updatedAt } = domain;
    return new UserInfo({ id, email, createdAt, updatedAt });
  }
}

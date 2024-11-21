export type UserRequestDtoProps = {
  id: number;
  email: string;
};

export class UserRequestDto {
  constructor(private readonly props: UserRequestDtoProps) {}

  get id(): number {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }
}

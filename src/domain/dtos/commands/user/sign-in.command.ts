export type SignInCommandProps = {
  email: string;
  password: string;
};

export class SignInCommand {
  constructor(private readonly props: SignInCommandProps) {}

  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }
}

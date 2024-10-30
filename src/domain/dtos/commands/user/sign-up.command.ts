export type SignUpCommandProps = {
  email: string;
  password: string;
};

export class SignUpCommand {
  constructor(public readonly props: SignUpCommandProps) {}

  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }
}

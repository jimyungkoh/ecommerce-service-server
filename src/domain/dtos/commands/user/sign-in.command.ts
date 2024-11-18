export type SignInCommandProps = {
  email: string;
  password: string;
};

export class SignInCommand {
  readonly email: string;
  readonly password: string;

  constructor(props: SignInCommandProps) {
    this.email = props.email;
    this.password = props.password;
  }
}

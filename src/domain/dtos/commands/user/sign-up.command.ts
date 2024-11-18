export type SignUpCommandProps = {
  email: string;
  password: string;
};

export class SignUpCommand {
  readonly email: string;
  readonly password: string;

  constructor(props: SignUpCommandProps) {
    this.email = props.email;
    this.password = props.password;
  }
}

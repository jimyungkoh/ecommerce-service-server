export type UserSignInResultProps = {
  accessToken: string;
};

export class UserSignInResult {
  constructor(readonly accessToken: string) {
    this.accessToken = accessToken;
  }

  static from(accessToken: string) {
    return new UserSignInResult(accessToken);
  }
}

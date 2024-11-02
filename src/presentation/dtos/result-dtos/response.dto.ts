export abstract class ResponseDTO<T> {
  constructor(protected readonly props: T) {}

  toJSON(): T {
    return this.props;
  }
}

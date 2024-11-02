export abstract class InfoDTO<T> {
  constructor(protected readonly props: T) {}

  toJSON(): T {
    return this.props;
  }
}

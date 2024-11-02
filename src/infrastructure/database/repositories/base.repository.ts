export interface BaseRepository<T, R> {
  create(data: T): Promise<R>;
  update(id: number, data: T): Promise<R>;
  delete(id: number): Promise<R | void>;
  findById(id: number): Promise<R | null>;
  findAll(): Promise<R[]>;
  getById(id: number): Promise<R>;
}

export interface BaseRepository<T, R> {
  create(data: T): Promise<R>;
  update(id: number | bigint, data: T): Promise<R>;
  delete(id: number | bigint): Promise<R | void>;
  findById(id: number | bigint): Promise<R | null>;
  findAll(): Promise<R[]>;
  getById(id: number | bigint): Promise<R>;
}

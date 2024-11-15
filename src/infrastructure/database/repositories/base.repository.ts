import { Effect } from 'effect';

export interface BaseRepository<T, R> {
  create(data: T): Effect.Effect<R, Error>;
  update(id: number, data: T): Effect.Effect<R, Error>;
  delete(id: number): Effect.Effect<void, Error>;
  findOneBy(id: number): Effect.Effect<R | null, Error>;
  findAll(): Effect.Effect<R[], Error>;
  getById(id: number): Effect.Effect<R, Error>;
}

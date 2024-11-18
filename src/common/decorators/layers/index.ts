import { applyDecorators, SetMetadata } from '@nestjs/common';

export const SERVICE_METADATA = Symbol('SERVICE');

export const Service = (): ClassDecorator =>
  applyDecorators(SetMetadata(SERVICE_METADATA, true));

export const FACADE_METADATA = Symbol('FACADE');

export const Facade = (): ClassDecorator =>
  applyDecorators(SetMetadata(FACADE_METADATA, true));

export const REPOSITORY_METADATA = Symbol('REPOSITORY');

export const Repository = (): ClassDecorator =>
  applyDecorators(SetMetadata(REPOSITORY_METADATA, true));

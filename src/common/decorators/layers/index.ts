import { applyDecorators, SetMetadata } from '@nestjs/common';

export const DOMAIN_METADATA = Symbol('DOMAIN');

export const Domain = (): ClassDecorator =>
  applyDecorators(SetMetadata(DOMAIN_METADATA, true));

export const APPLICATION_METADATA = Symbol('APPLICATION');

export const Application = (): ClassDecorator =>
  applyDecorators(SetMetadata(APPLICATION_METADATA, true));

export const INFRASTRUCTURE_METADATA = Symbol('REPOSITORY');

export const Infrastructure = (): ClassDecorator =>
  applyDecorators(SetMetadata(INFRASTRUCTURE_METADATA, true));

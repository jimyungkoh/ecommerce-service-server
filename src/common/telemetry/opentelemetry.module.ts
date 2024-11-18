/* eslint-disable @typescript-eslint/no-explicit-any */
import { Module, OnModuleInit } from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
} from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Effect, pipe } from 'effect';
import {
  FACADE_METADATA,
  REPOSITORY_METADATA,
  SERVICE_METADATA,
} from '../decorators';

@Module({
  imports: [DiscoveryModule],
})
export class OpenTelemetryModule implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit() {
    this.getProviders().forEach((provider) => {
      const instance = provider.instance;
      const prototype = Object.getPrototypeOf(instance);
      const methods = this.metadataScanner.getAllMethodNames(prototype);

      methods.forEach((method) => {
        const spanName = `${provider.name}.${method}`;
        // span을 붙이는 로직을 추가해서 메소드를 오버라이드한다.
        prototype[method] = this.wrap(prototype[method], spanName);
      });
    });
  }

  private getProviders(): InstanceWrapper[] {
    // 모든 컨트롤러, 서비스, 리포지토리 인스턴스를 가져온다.
    return [...this.discoveryService.getProviders()].filter((provider) =>
      this.isSpanTarget(provider),
    );
  }

  private isSpanTarget(wrapper: InstanceWrapper): boolean {
    // 원하는 메타데이터가 존재하는지 확인한다.
    // RESOLVER_TYPE_METADATA은 GraphQL을 사용하는 경우 모든 리졸버 클래스에 생성된다.
    return (
      wrapper.metatype &&
      (Reflect.hasMetadata(FACADE_METADATA, wrapper.metatype as any) ||
        Reflect.hasMetadata(REPOSITORY_METADATA, wrapper.metatype as any) ||
        Reflect.hasMetadata(SERVICE_METADATA, wrapper.metatype as any))
    );
  }

  private wrap(prototype: Record<any, any>, spanName: string) {
    const method = {
      [prototype.name]: function (...args: any[]) {
        const value = prototype.apply(this, args);

        if (Effect.isEffect(value)) {
          return pipe(value, Effect.withSpan(spanName));
        }

        return value;
      },
    }[prototype.name];

    // 기존에 존재한 metadata 복사
    const source = prototype;
    Reflect.getMetadataKeys(source).forEach((key) => {
      const meta = Reflect.getMetadata(key, source);
      Reflect.defineMetadata(key, meta, method as any);
    });

    return method;
  }
}

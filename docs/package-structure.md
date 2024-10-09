# 패키지 구조: Layered Architecture

순환참조를 방지하고 및 계층 간 정확한 역할 분리를 위해 Layered Architecture 기반의 패키징을 선택했습니다.

![애플리케이션 패키지 설계](https://i.imgur.com/fNd2cix.png)

프로젝트의 기본 패키지 구조는 다음과 같습니다:

```text
hhplus-server-ecommerce/src
├── app.module.ts
├── main.ts
├── common
├── application
│   ├── application.module.ts
│   ├── components
│   └── services
├── domain
│   ├── domain.module.ts
│   └── value-objects
├── infrastructure
│   └── infrastructure.module.ts
└── presentation
    ├── controllers
    ├── filters
    └── presentation.module.ts
```

이 구조는 다음과 같은 주요 패키지로 구성되어 있습니다.

- 계층 관련 패키지에는 해당 모듈의 설정(controllers, providers, imports, exports 등)을 담당하는 module.ts 파일이 포함되어 있습니다.

## common

애플리케이션 전반에서 사용되는 공통 유틸리티, 상수, 인터페이스 등을 포함합니다.

## application (Layer)

애플리케이션의 핵심 로직을 포함합니다.

- components: 재사용 가능한 컴포넌트들을 포함합니다.
- services: 비즈니스 로직을 처리하는 서비스들을 포함합니다.

## domain (Layer)

도메인 모델과 관련된 코드를 포함합니다

- value-objects: 값 객체들을 정의합니다.

## infrastructure (Layer)

외부 시스템과의 통신, 데이터베이스 연결 등 인프라 관련 코드를 포함합니다.

## presentation (Layer)

사용자 인터페이스 관련 코드를 포함합니다.

- controllers: API 엔드포인트를 정의하는 컨트롤러들을 포함합니다.
- filters: 예외 처리 및 요청/응답 변환을 위한 필터들을 포함합니다.

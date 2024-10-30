export const LogLevels = {
  emergency: {
    priority: 0,
    name: 'emergency',
  }, // 전체 시스템이 사용 불가능한 상태
  fatal: {
    priority: 1,
    name: 'fatal',
  }, // 즉각적인 조치가 필요한 치명적인 오류 상태
  error: {
    priority: 2,
    name: 'error',
  }, // 의도되지 않은 오류 이벤트 (Not Expected Error)
  warn: {
    priority: 3,
    name: 'warn',
  }, // Deprecated API 사용, 하위호환성 유지 기능, 빈번한 의도된 에러 발생
  info: {
    priority: 4,
    name: 'info',
  }, // 일반적인 정보, 의도된 에러(NotFound/Validation), 데이터 변환 정보, 외부 요청/응답
  debug: {
    priority: 5,
    name: 'debug',
  }, // 개발,디버그 환경에서만 필요한 상세 추적 정보
} as const;

export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];
export type LogLevelName = LogLevel['name'];
export type LogLevelPriority = LogLevel['priority'];

export const AppLoggerToken = Symbol('AppLogger');
export interface AppLogger {
  log(
    level: LogLevelName,
    message: string | Error,
    data?: LogData,
    profile?: string,
  ): void;
  debug(message: string, data?: LogData, profile?: string): void;
  info(message: string, data?: LogData, profile?: string): void;
  warn(message: string | Error, data?: LogData, profile?: string): void;
  error(message: string | Error, data?: LogData, profile?: string): void;
  fatal(message: string | Error, data?: LogData, profile?: string): void;
  emergency(message: string | Error, data?: LogData, profile?: string): void;
  startProfile(id: string): void;
}

export interface LogData {
  context?: string; // 실행하는 업무의 범위나 영역을 나타내는 이름
  app?: string; // 애플리케이션 또는 마이크로서비스 이름
  sourceClass?: string; // 소스의 클래스명
  error?: Error; // 에러 객체
  props?: NodeJS.Dict<unknown>; // 추가 커스텀 속성
}

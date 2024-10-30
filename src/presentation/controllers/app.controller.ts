import { Controller, Get } from '@nestjs/common';

/**
 * @class AppController
 * @description 애플리케이션의 기본 컨트롤러 클래스입니다.
 */
@Controller()
export class AppController {
  constructor() {}

  /**
   * 서버의 상태를 확인하기 위한 헬스 체크 엔드포인트입니다.
   * @method healthCheck
   * @returns {string} 서버 상태를 나타내는 문자열 ('OK')
   */
  @Get()
  healthCheck(): string {
    return 'OK';
  }
}

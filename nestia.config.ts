import { INestiaConfig } from '@nestia/sdk';

const config: INestiaConfig = {
  input: 'src/presentation/controllers',
  output: 'docs/swagger.json',
  swagger: {
    servers: [{ url: 'http://localhost:3000', description: 'Local Server' }],
    output: 'docs/swagger.json',
    info: {
      title: 'E-Commerce Service API',
      version: '1.0.0',
      description: '이커머스 서비스의 API 문서입니다.',
    },
  },
};

export default config;

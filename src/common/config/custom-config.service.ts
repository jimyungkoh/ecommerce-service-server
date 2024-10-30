import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';

@Injectable()
export class CustomConfigService extends ConfigService {
  private readonly jwtSecretValue: string;

  constructor() {
    super();
    this.jwtSecretValue = this.get('JWT_SECRET', nanoid(17));
  }

  get saltRounds(): number {
    return parseInt(this.get('SALT_ROUNDS', '10'));
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get databaseUrl(): string {
    return this.getOrThrow('DATABASE_URL');
  }

  get jwtSecret(): string {
    return this.jwtSecretValue;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class UserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async signUp() {
    return await this.prisma.user.create({
      data: {
        email: '',
        password: '',
      },
    });
  }
}

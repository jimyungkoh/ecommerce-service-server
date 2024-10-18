import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/infrastructure/database/repositories';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(userId: number) {
    try {
      return await this.userRepository.getById(userId);
    } catch (error) {
      throw new UserNotFoundException();
    }
  }
}

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, RolesGuard],
  exports: [UserService], // Export UserService so AuthModule can use it
})
export class UserModule {}

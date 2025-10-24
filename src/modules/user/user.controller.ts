import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin-only endpoint: list all users
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // Minimal protected route to demonstrate JwtAuthGuard usage (Stage 4.3)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: RequestWithUser) {
    const id = req.user?.id;
    return this.userService.findOne(id as string);
  }
}

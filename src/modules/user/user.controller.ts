import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin-only endpoint: list all users
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiOperation({
    summary: 'List all users (Admin only)',
    description:
      'Returns a list of all users in the system. Requires ADMIN role. Passwords are excluded from the response.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '690312054bee3cc23279f665' },
              email: { type: 'string', example: 'admin@example.com' },
              name: { type: 'string', example: 'Admin User', nullable: true },
              role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires ADMIN role',
  })
  findAll() {
    return this.userService.findAll();
  }

  // Minimal protected route to demonstrate JwtAuthGuard usage (Stage 4.3)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the currently authenticated user based on the JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '690312054bee3cc23279f665' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  me(@Request() req: RequestWithUser) {
    const id = req.user?.id;
    return this.userService.findOne(id as string);
  }
}

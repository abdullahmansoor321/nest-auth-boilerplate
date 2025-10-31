import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Patch('users/:id/role')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update user role (Admin only)',
    description: `Allows administrators to promote or demote users between USER and ADMIN roles.
    
**Security Features:**
- **Token Invalidation**: All user sessions are terminated on role change, forcing re-login with new JWT containing updated role
- **Self-Demotion Prevention**: Administrators cannot demote themselves to prevent accidental lockout
- **Last Admin Protection**: System ensures at least one admin always exists - cannot demote the last admin
- **Audit Logging**: All role changes are logged with admin ID, target user ID, and new role

**Behavior:**
- Any admin can be demoted as long as at least one other admin exists
- No specific users are "protected" - protection is system-level, not user-level
- Promotes or demotes take effect immediately after re-login (old JWT expires naturally within 15 minutes)

Requires ADMIN role.`,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update',
    example: '690312054bee3cc23279f666',
    type: String,
  })
  @ApiBody({
    description: 'Role update payload',
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['USER', 'ADMIN'],
          example: 'ADMIN',
          description: 'New role to assign to the user',
        },
      },
      required: ['role'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Role updated successfully. All user sessions have been invalidated - user must re-login.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '690312054bee3cc23279f666' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-30T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-10-31T08:00:00.000Z' },
            sessionsInvalidated: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example:
                'Role updated. User must re-login to apply changes. All active sessions have been terminated.',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: `Bad Request - Security validation failed. Possible reasons:

**Self-Demotion Prevention:**
- You attempted to demote yourself from ADMIN to USER
- Solution: Ask another administrator to change your role

**Last Admin Protection:**
- You attempted to demote the only remaining administrator
- Solution: Promote another user to ADMIN first, then demote this user
- This ensures the system always has at least one admin

**Note:** Any admin can be demoted as long as these rules are satisfied. There are no "protected" user accounts.`,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          examples: [
            'Cannot demote yourself. Ask another administrator to change your role.',
            'Cannot demote the last administrator. Promote another user to ADMIN first.',
          ],
          example: 'Cannot demote the last administrator. Promote another user to ADMIN first.',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires ADMIN role',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User with ID 690312054bee3cc23279f666 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: 'USER' | 'ADMIN',
    @Request() req: { user: { id: string; email: string; role: string } },
  ) {
    const adminUserId = req.user.id;

    // 🔒 SECURITY: Prevent self-demotion
    if (userId === adminUserId && role === 'USER') {
      throw new BadRequestException(
        'Cannot demote yourself. Ask another administrator to change your role.',
      );
    }

    // 🔒 SECURITY: Ensure at least one admin remains
    if (role === 'USER') {
      const adminCount = await this.userService.countAdmins();
      const targetUser = await this.userService.findById(userId);

      if (targetUser.role === 'ADMIN' && adminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last administrator. Promote another user to ADMIN first.',
        );
      }
    }

    // Update the user's role
    const updatedUser = await this.userService.updateUserRole(userId, role);

    // 🔒 CRITICAL SECURITY: Invalidate all refresh tokens for this user
    // This forces re-login, which issues new JWT with correct role
    // Without this, the user's old JWT (with old role) remains valid for 15 minutes
    await this.authService.logoutAllDevices(userId);

    // Audit log
    this.logger.log(
      `ADMIN ACTION: Role Change. Admin User ID: ${adminUserId}, Target User ID: ${userId}, New Role: ${role}. All sessions invalidated.`,
    );

    return {
      ...updatedUser,
      sessionsInvalidated: true,
      message:
        'Role updated. User must re-login to apply changes. All active sessions have been terminated.',
    };
  }
}

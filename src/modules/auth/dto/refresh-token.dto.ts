import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token received during login',
    example: 'a1b2c3d4e5f6g7h8i9j0...',
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

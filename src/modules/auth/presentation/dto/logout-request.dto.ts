import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LogoutRequestDto {
  @ApiProperty({ description: 'Refresh JWT to revoke', writeOnly: true })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

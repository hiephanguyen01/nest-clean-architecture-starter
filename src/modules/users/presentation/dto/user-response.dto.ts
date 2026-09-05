import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'Alice' })
  name!: string;

  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  role!: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class UserEnvelopeDto {
  @ApiProperty({ type: UserResponseDto })
  data!: UserResponseDto;
}

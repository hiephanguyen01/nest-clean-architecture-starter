import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'user@example.com' }) email!: string;
  @ApiProperty({ example: 'Alice' }) name!: string;
  @ApiProperty({ enum: ['ADMIN', 'USER'] }) role!: string;
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] }) status!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class AuthTokensResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ format: 'date-time' }) accessTokenExpiresAt!: string;
  @ApiProperty({ format: 'date-time' }) refreshTokenExpiresAt!: string;
}

export class AuthSessionResponseDto {
  @ApiProperty({ type: AuthUserResponseDto }) user!: AuthUserResponseDto;
  @ApiProperty({ type: AuthTokensResponseDto }) tokens!: AuthTokensResponseDto;
}

export class AuthSessionEnvelopeDto {
  @ApiProperty({ type: AuthSessionResponseDto }) data!: AuthSessionResponseDto;
}

export class AuthTokensEnvelopeDto {
  @ApiProperty({ type: AuthTokensResponseDto }) data!: AuthTokensResponseDto;
}

export class AuthUserEnvelopeDto {
  @ApiProperty({ type: AuthUserResponseDto }) data!: AuthUserResponseDto;
}

export class EmptySuccessEnvelopeDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
  })
  data!: null;
}

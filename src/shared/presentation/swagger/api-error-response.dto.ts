import { ApiProperty } from '@nestjs/swagger';

export class ApiValidationErrorDetailDto {
  @ApiProperty({ example: 'email' })
  field!: string;

  @ApiProperty({ type: [String], example: ['email must be an email'] })
  messages!: string[];
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ type: [ApiValidationErrorDetailDto] })
  errors!: ApiValidationErrorDetailDto[];

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/auth/register' })
  path!: string;

  @ApiProperty({ required: false, example: '2db0737e-950c-49ac-ae99-b8ae6bbdfc40' })
  requestId?: string;
}

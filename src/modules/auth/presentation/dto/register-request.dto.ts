import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Alice', minLength: 1, maxLength: 120 })
  @Transform(({ value }: TransformFnParams) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}

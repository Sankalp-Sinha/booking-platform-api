import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Backend Consultation',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example: 'A one-hour backend engineering consultation',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({
    example: 60,
    description: 'Duration in minutes',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiProperty({
    example: 999.99,
    minimum: 0,
  })
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

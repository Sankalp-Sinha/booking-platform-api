import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'Sankalp Sinha',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName!: string;

  @ApiProperty({
    example: 'customer@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  customerEmail!: string;

  @ApiProperty({
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  customerPhone!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({
    example: '2026-07-20',
    description: 'Booking date in YYYY-MM-DD format',
  })
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must use YYYY-MM-DD format',
  })
  bookingDate!: string;

  @ApiProperty({
    example: '14:30',
    description: 'Booking time in HH:mm format',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must use HH:mm format',
  })
  bookingTime!: string;

  @ApiPropertyOptional({
    example: 'Please call before the appointment',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token returned by login or the previous refresh request',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

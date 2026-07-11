import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BookingsService } from './bookings.service.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({
    summary: 'Create a public customer booking',
  })
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get paginated and filtered bookings',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a booking by ID',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.bookingsService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update booking status',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe())
    id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cancel a booking',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.bookingsService.cancel(id);
  }
}

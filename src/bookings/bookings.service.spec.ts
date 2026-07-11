import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { BookingStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BookingsService } from './bookings.service.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';

const prismaMock = {
  service: {
    findUnique: jest.fn(),
  },
  booking: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

function getFutureDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 2);

  return date.toISOString().slice(0, 10);
}

function getPastDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

function createValidDto(): CreateBookingDto {
  return {
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+919876543210',
    serviceId: '550e8400-e29b-41d4-a716-446655440000',
    bookingDate: getFutureDate(),
    bookingTime: '14:30',
    notes: 'Test booking',
  };
}

describe('BookingsService', () => {
  let bookingsService: BookingsService;

  beforeEach(() => {
    jest.resetAllMocks();

    bookingsService = new BookingsService(
      prismaMock as unknown as PrismaService,
    );
  });

  it('rejects a booking when the service does not exist', async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      bookingsService.create(createValidDto()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a booking for an inactive service', async () => {
    prismaMock.service.findUnique.mockResolvedValue({
      id: createValidDto().serviceId,
      isActive: false,
    });

    await expect(
      bookingsService.create(createValidDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a booking with a past date', async () => {
    prismaMock.service.findUnique.mockResolvedValue({
      id: createValidDto().serviceId,
      isActive: true,
    });

    const dto = createValidDto();
    dto.bookingDate = getPastDate();

    await expect(bookingsService.create(dto)).rejects.toThrow(
      'Booking date cannot be in the past',
    );
  });

  it('rejects a duplicate booking slot', async () => {
    prismaMock.service.findUnique.mockResolvedValue({
      id: createValidDto().serviceId,
      isActive: true,
    });

    prismaMock.booking.findFirst.mockResolvedValue({
      id: 'existing-booking-id',
    });

    await expect(
      bookingsService.create(createValidDto()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents a cancelled booking from being completed', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440001',
      status: BookingStatus.CANCELLED,
      service: {
        id: createValidDto().serviceId,
      },
    });

    await expect(
      bookingsService.updateStatus('550e8400-e29b-41d4-a716-446655440001', {
        status: BookingStatus.COMPLETED,
      }),
    ).rejects.toThrow('A cancelled booking cannot be marked as completed');

    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });
});

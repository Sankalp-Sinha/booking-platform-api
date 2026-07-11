import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookingStatus } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { BookingQueryDto } from './dto/booking-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({
      where: {
        id: dto.serviceId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Selected service does not exist');
    }

    if (!service.isActive) {
      throw new BadRequestException(
        'Bookings cannot be created for an inactive service',
      );
    }

    const bookingDate = this.parseBookingDate(dto.bookingDate);

    this.validateBookingDate(bookingDate);

    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        serviceId: dto.serviceId,
        bookingDate,
        bookingTime: dto.bookingTime,
      },
      select: {
        id: true,
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'This service is already booked for the selected date and time',
      );
    }

    try {
      return await this.prisma.booking.create({
        data: {
          customerName: dto.customerName.trim(),
          customerEmail: dto.customerEmail.trim().toLowerCase(),
          customerPhone: dto.customerPhone.trim(),
          serviceId: dto.serviceId,
          bookingDate,
          bookingTime: dto.bookingTime,
          notes: dto.notes?.trim(),
        },
        include: {
          service: true,
        },
      });
    } catch (error: unknown) {
      if (this.hasPrismaErrorCode(error, 'P2002')) {
        throw new ConflictException(
          'This service is already booked for the selected date and time',
        );
      }

      if (this.hasPrismaErrorCode(error, 'P2003')) {
        throw new NotFoundException('Selected service does not exist');
      }

      throw error;
    }
  }

  async findAll(query: BookingQueryDto) {
    const { page = 1, limit = 10, status } = query;

    const search = query.search?.trim();
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      ...(status && {
        status,
      }),

      ...(search && {
        OR: [
          {
            customerName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            customerEmail: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            customerPhone: {
              contains: search,
            },
          },
        ],
      }),
    };

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          service: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.booking.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: bookings,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        service: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id);

    if (
      booking.status === BookingStatus.CANCELLED &&
      dto.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'A cancelled booking cannot be marked as completed',
      );
    }

    return this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
      include: {
        service: true,
      },
    });
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    return this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
      include: {
        service: true,
      },
    });
  }

  private parseBookingDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    const isValidDate =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;

    if (!isValidDate) {
      throw new BadRequestException('bookingDate is not a valid calendar date');
    }

    return date;
  }

  private validateBookingDate(bookingDate: Date): void {
    const now = new Date();

    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    if (bookingDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }
  }

  private hasPrismaErrorCode(error: unknown, expectedCode: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === expectedCode
    );
  }
}

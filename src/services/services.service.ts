import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateServiceDto } from './dto/create-service.dto.js';
import type { UpdateServiceDto } from './dto/update-service.dto.js';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.service.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: {
        id,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    return this.prisma.service.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    try {
      await this.prisma.service.delete({
        where: {
          id,
        },
      });
    } catch (error: unknown) {
      if (this.hasPrismaErrorCode(error, 'P2003')) {
        throw new ConflictException(
          'Service cannot be deleted because it has existing bookings',
        );
      }

      if (this.hasPrismaErrorCode(error, 'P2025')) {
        throw new NotFoundException('Service not found');
      }

      throw error;
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

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServicesService } from './services.service.js';

@ApiTags('Services')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({
    summary: 'Create a new service',
  })
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @ApiOperation({
    summary: 'Get all services',
  })
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @ApiOperation({
    summary: 'Get a service by ID',
  })
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.servicesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a service',
  })
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe())
    id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a service',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ): Promise<void> {
    await this.servicesService.remove(id);
  }
}

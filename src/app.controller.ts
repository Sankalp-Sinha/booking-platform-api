import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      name: 'Booking Platform API',
      status: 'running',
      message: 'The API has been deployed successfully.',
      documentation: '/api/docs',
      healthCheck: '/api/health',
    };
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}

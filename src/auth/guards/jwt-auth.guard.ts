import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const accessSecret =
        this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: accessSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException();
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    const [scheme, token] = authorization?.split(' ') ?? [];

    return scheme === 'Bearer' ? token : undefined;
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { JwtPayload } from './types/jwt-payload.type.js';

@Injectable()
export class AuthService {
  private readonly passwordSaltRounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.passwordSaltRounds,
    );

    const user = await this.usersService.create(email, passwordHash);

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.signTokenPair(user.id, user.email);

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshToken = dto.refreshToken;

    const payload = await this.verifyRefreshToken(refreshToken);

    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt !== null ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newTokens = await this.signTokenPair(user.id, user.email);

    const newTokenHash = this.hashToken(newTokens.refreshToken);

    await this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      if (revokeResult.count !== 1) {
        throw new UnauthorizedException('Refresh token has already been used');
      }

      await tx.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: user.id,
          expiresAt: newTokens.refreshTokenExpiresAt,
        },
      });
    });

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  private async signTokenPair(userId: string, email: string) {
    const accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessTtlSeconds = Number(
      this.configService.getOrThrow<string>('JWT_ACCESS_TTL_SECONDS'),
    );

    const refreshTtlSeconds = Number(
      this.configService.getOrThrow<string>('JWT_REFRESH_TTL_SECONDS'),
    );

    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessTtlSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTtlSeconds,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: refreshSecret,
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException();
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt,
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

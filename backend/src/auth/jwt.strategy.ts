import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/auth-user';
import { UsersService } from '../users/users.service';

// Runs on every protected request: verifies the token, then loads the user from MongoDB
// so a deactivated user is blocked immediately (even with a still-valid token).
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string }): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive)
      throw new UnauthorizedException('Please log in again.');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      outletId: user.outletId ? user.outletId.toString() : undefined,
    };
  }
}

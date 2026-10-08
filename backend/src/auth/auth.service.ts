import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing)
      throw new ConflictException('An account with this email already exists.');

    // Never store the real password: store a bcrypt hash (10 salt rounds).
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.create({
      name: input.name.trim(),
      email: input.email,
      passwordHash,
      role: input.role,
    });
    return { accessToken: this.signToken(user), user };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);
    // Same message for "no such user" and "wrong password" so attackers learn nothing.
    const passwordOk = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;
    if (!user || !passwordOk)
      throw new UnauthorizedException('Invalid email or password.');
    if (!user.isActive)
      throw new UnauthorizedException('This account has been deactivated.');
    return { accessToken: this.signToken(user), user };
  }

  // The token only stores the user id + role. It is signed with JWT_SECRET.
  private signToken(user: { id: string; role: string }) {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }
}

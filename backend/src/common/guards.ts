import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from './decorators';
import { Role } from './enums';

// Checks the "Authorization: Bearer <token>" header (JWT). Rejects if missing/invalid.
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    return GqlExecutionContext.create(context).getContext().req;
  }
}

// Runs AFTER GqlAuthGuard. Checks the user's role against @Roles(...).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed || allowed.length === 0) return true;
    const user = GqlExecutionContext.create(context).getContext().req.user;
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to do this.');
    }
    return true;
  }
}

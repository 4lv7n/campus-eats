import { Role } from './enums';

// The logged-in user object that the JWT guard attaches to every request.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  outletId?: string; // only set for OUTLET_STAFF
}

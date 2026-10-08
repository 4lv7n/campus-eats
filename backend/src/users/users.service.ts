import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { assertObjectId } from '../common/helpers';
import { Role } from '../common/enums';
import { UpdateProfileInput } from './dto/update-profile.input';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string) {
    if (!id || id.length !== 24) return null;
    return this.userModel.findById(id);
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }) {
    return this.userModel.create(data);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    if (input.name) user.name = input.name.trim();

    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new BadRequestException(
          'Enter your current password to set a new one.',
        );
      }
      const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!ok) throw new BadRequestException('Current password is incorrect.');
      user.passwordHash = await bcrypt.hash(input.newPassword, 10);
    }
    return user.save();
  }

  // ---- used by the admin module ----
  listAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  count() {
    return this.userModel.countDocuments();
  }

  async setActive(userId: string, isActive: boolean) {
    const user = await this.userModel.findById(
      assertObjectId(userId, 'user ID'),
    );
    if (!user) throw new NotFoundException('User not found.');
    user.isActive = isActive;
    return user.save();
  }

  async assignOutlet(userId: string, outletId: string) {
    const user = await this.userModel.findById(
      assertObjectId(userId, 'user ID'),
    );
    if (!user) throw new NotFoundException('User not found.');
    user.role = Role.OUTLET_STAFF;
    user.outletId = assertObjectId(outletId, 'outlet ID');
    return user.save();
  }

  recent(limit: number) {
    return this.userModel.find().sort({ createdAt: -1 }).limit(limit);
  }
}

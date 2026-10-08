import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { assertObjectId, escapeRegex } from '../common/helpers';
import { CreateOutletInput, UpdateOutletInput } from './dto/outlet.input';
import { Outlet, OutletDocument } from './outlet.schema';

@Injectable()
export class OutletsService {
  constructor(
    @InjectModel(Outlet.name) private outletModel: Model<OutletDocument>,
  ) {}

  // Public list: only outlets the admin has not disabled.
  findActive(search?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (search && search.trim())
      filter.name = new RegExp(escapeRegex(search.trim()), 'i');
    return this.outletModel.find(filter).sort({ name: 1 });
  }

  // Admin list: everything.
  findAll() {
    return this.outletModel.find().sort({ name: 1 });
  }

  async activeIds() {
    const outlets = await this.outletModel
      .find({ isActive: true })
      .select('_id');
    return outlets.map((o) => o._id);
  }

  async findById(id: string) {
    return this.outletModel.findById(assertObjectId(id, 'outlet ID'));
  }

  async findByIdOrThrow(id: string) {
    const outlet = await this.findById(id);
    if (!outlet) throw new NotFoundException('Outlet not found.');
    return outlet;
  }

  count() {
    return this.outletModel.countDocuments();
  }

  async create(input: CreateOutletInput) {
    const exists = await this.outletModel.findOne({ name: input.name.trim() });
    if (exists)
      throw new ConflictException('An outlet with this name already exists.');
    return this.outletModel.create({ ...input, name: input.name.trim() });
  }

  async update(input: UpdateOutletInput) {
    const { id, ...changes } = input;
    const outlet = await this.findByIdOrThrow(id);
    Object.entries(changes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) (outlet as any)[key] = value;
    });
    return outlet.save();
  }

  // Staff may only open/close THEIR OWN outlet.
  async setOpen(user: AuthUser, isOpen: boolean) {
    if (!user.outletId)
      throw new ForbiddenException('No outlet is assigned to your account.');
    const outlet = await this.findByIdOrThrow(user.outletId);
    outlet.isOpen = isOpen;
    return outlet.save();
  }
}

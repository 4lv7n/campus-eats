import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { Role } from '../common/enums';
import { assertObjectId, escapeRegex } from '../common/helpers';
import { OutletsService } from '../outlets/outlets.service';
import {
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from './dto/menu-item.input';
import { MenuItem, MenuItemDocument } from './menu-item.schema';

export interface MenuFilter {
  outletId?: string;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
}

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(MenuItem.name) private menuModel: Model<MenuItemDocument>,
    private outletsService: OutletsService,
  ) {}

  // Search + filter. Without outletId it searches the menus of ALL active outlets.
  async findMany(filter: MenuFilter) {
    const query: Record<string, any> = {};

    if (filter.outletId) {
      query.outletId = assertObjectId(filter.outletId, 'outlet ID');
    } else {
      query.outletId = { $in: await this.outletsService.activeIds() };
    }
    if (filter.search?.trim())
      query.name = new RegExp(escapeRegex(filter.search.trim()), 'i');
    if (filter.category?.trim()) query.category = filter.category.trim();
    if (filter.availableOnly) query.available = true;

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
    }
    return this.menuModel.find(query).sort({ category: 1, name: 1 });
  }

  async findByIdOrThrow(id: string) {
    const item = await this.menuModel.findById(
      assertObjectId(id, 'menu item ID'),
    );
    if (!item) throw new NotFoundException('Menu item not found.');
    return item;
  }

  findByIds(ids: Types.ObjectId[]) {
    return this.menuModel.find({ _id: { $in: ids } });
  }

  countByOutlet(outletId: string) {
    return this.menuModel.countDocuments({
      outletId: assertObjectId(outletId, 'outlet ID'),
    });
  }

  // KEY SECURITY RULE: admin can manage any outlet; staff only their own.
  private assertCanManage(user: AuthUser, outletId: string) {
    if (user.role === Role.ADMIN) return;
    if (user.role === Role.OUTLET_STAFF && user.outletId === outletId) return;
    throw new ForbiddenException(
      'You can only manage the menu of your own outlet.',
    );
  }

  async create(user: AuthUser, input: CreateMenuItemInput) {
    const outletId =
      user.role === Role.OUTLET_STAFF ? user.outletId : input.outletId;
    if (!outletId) throw new BadRequestException('An outlet is required.');
    this.assertCanManage(user, outletId);
    await this.outletsService.findByIdOrThrow(outletId); // make sure it exists

    return this.menuModel.create({
      outletId: new Types.ObjectId(outletId),
      name: input.name.trim(),
      description: input.description ?? '',
      price: input.price,
      image: input.image ?? '',
      category: input.category?.trim() || 'General',
      available: input.available ?? true,
    });
  }

  async update(user: AuthUser, input: UpdateMenuItemInput) {
    const { id, ...changes } = input;
    const item = await this.findByIdOrThrow(id);
    this.assertCanManage(user, item.outletId.toString());

    Object.entries(changes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) (item as any)[key] = value;
    });
    return item.save();
  }

  async remove(user: AuthUser, id: string) {
    const item = await this.findByIdOrThrow(id);
    this.assertCanManage(user, item.outletId.toString());
    await item.deleteOne();
    return true;
  }
}

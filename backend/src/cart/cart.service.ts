import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { assertObjectId, roundMoney } from '../common/helpers';
import { MenuService } from '../menu/menu.service';
import { OutletsService } from '../outlets/outlets.service';
import { Cart, CartDocument } from './cart.schema';

const MAX_PER_ITEM = 20;

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private menuService: MenuService,
    private outletsService: OutletsService,
  ) {}

  // Every query uses the logged-in user's id, so nobody can touch another user's cart.
  async getCart(userId: string) {
    const uid = new Types.ObjectId(userId);
    const cart = await this.cartModel.findOne({ userId: uid });
    return cart ?? this.cartModel.create({ userId: uid, items: [] });
  }

  async addToCart(userId: string, menuItemId: string, quantity: number) {
    const item = await this.menuService.findByIdOrThrow(menuItemId);
    if (!item.available)
      throw new BadRequestException(`${item.name} is currently unavailable.`);

    const outlet = await this.outletsService.findByIdOrThrow(
      item.outletId.toString(),
    );
    if (!outlet.isActive)
      throw new BadRequestException('This outlet is not available.');
    if (!outlet.isOpen)
      throw new BadRequestException(`${outlet.name} is closed right now.`);

    const cart = await this.getCart(userId);

    // One outlet per cart.
    if (
      cart.items.length > 0 &&
      cart.outletId &&
      !cart.outletId.equals(item.outletId)
    ) {
      throw new BadRequestException(
        `Your cart has items from ${cart.outletName}. Clear your cart or place that order first.`,
      );
    }
    if (cart.items.length === 0) {
      cart.outletId = item.outletId;
      cart.outletName = outlet.name;
    }

    const existing = cart.items.find((i) => i.menuItemId.equals(item._id));
    if (existing) {
      if (existing.quantity + quantity > MAX_PER_ITEM) {
        throw new BadRequestException(
          `You can order at most ${MAX_PER_ITEM} of one item.`,
        );
      }
      existing.quantity += quantity;
      existing.price = item.price; // keep price fresh
    } else {
      cart.items.push({
        menuItemId: item._id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity,
      });
    }
    return cart.save();
  }

  async updateCartItem(userId: string, menuItemId: string, quantity: number) {
    const id = assertObjectId(menuItemId, 'menu item ID');
    const cart = await this.getCart(userId);
    const line = cart.items.find((i) => i.menuItemId.equals(id));
    if (!line) throw new BadRequestException('That item is not in your cart.');

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => !i.menuItemId.equals(id));
    } else {
      line.quantity = quantity;
    }
    return this.finish(cart);
  }

  async removeFromCart(userId: string, menuItemId: string) {
    const id = assertObjectId(menuItemId, 'menu item ID');
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((i) => !i.menuItemId.equals(id));
    return this.finish(cart);
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    cart.items = [];
    return this.finish(cart);
  }

  // If the cart became empty, forget the outlet so another outlet can be chosen.
  private finish(cart: CartDocument) {
    if (cart.items.length === 0) {
      cart.outletId = undefined;
      cart.outletName = undefined;
    }
    return cart.save();
  }

  static total(cart: { items: { price: number; quantity: number }[] }) {
    return roundMoney(
      cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    );
  }
}

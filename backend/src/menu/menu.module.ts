import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutletsModule } from '../outlets/outlets.module';
import { MenuItem, MenuItemSchema } from './menu-item.schema';
import { MenuResolver } from './menu.resolver';
import { MenuService } from './menu.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
    OutletsModule,
  ],
  providers: [MenuService, MenuResolver],
  exports: [MenuService],
})
export class MenuModule {}

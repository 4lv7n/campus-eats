import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Outlet, OutletSchema } from './outlet.schema';
import { OutletsResolver } from './outlets.resolver';
import { OutletsService } from './outlets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Outlet.name, schema: OutletSchema }]),
  ],
  providers: [OutletsService, OutletsResolver],
  exports: [OutletsService],
})
export class OutletsModule {}

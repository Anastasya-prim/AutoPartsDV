import { Module } from '@nestjs/common';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';
import { SupplierAggregatorService } from './supplier-aggregator.service';
import { BrowserPoolService } from './browser-pool.service';
import { AuthModule } from '../auth/auth.module';
import { ALL_ADAPTERS } from './suppliers';

@Module({
  imports: [AuthModule],
  controllers: [PartsController],
  providers: [
    BrowserPoolService,
    ...ALL_ADAPTERS,
    SupplierAggregatorService,
    PartsService,
  ],
})
export class PartsModule {}

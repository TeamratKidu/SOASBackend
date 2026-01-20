import { Module } from '@nestjs/common';
import { BiddingService } from './bidding.service';
import { BiddingGateway } from './bidding.gateway';
import { BiddingController } from './bidding.controller';

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BiddingController],
  providers: [BiddingService, BiddingGateway],
  exports: [BiddingService],
})
export class BiddingModule {}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BiddingService } from './bidding.service';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bids')
@Controller('bids')
export class BiddingController {
  constructor(private readonly biddingService: BiddingService) { }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get bid history for an auction' })
  getBidHistory(@Param('auctionId') auctionId: string) {
    return this.biddingService.getBidHistory(auctionId);
  }

  @Get('my-bids')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bids' })
  getMyBids(@CurrentUser() user: any) {
    return this.biddingService.getUserBids(user.id);
  }
}

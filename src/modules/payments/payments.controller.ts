import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Get,
  Param,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('initialize')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for won auction' })
  initializePayment(
    @Body() body: { auctionId: string },
    @Request() req,
  ) {
    return this.paymentsService.initializePayment(body.auctionId, req.user.id);
  }

  @Post('webhook/chapa')
  @ApiOperation({ summary: 'Chapa webhook endpoint' })
  handleChapaWebhook(
    @Body() payload: any,
    @Headers('chapa-signature') signature: string,
  ) {
    return this.paymentsService.handleChapaWebhook(payload, signature);
  }

  @Get('my-transactions')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transactions' })
  getMyTransactions(@Request() req) {
    return this.paymentsService.getUserTransactions(req.user.id);
  }
}

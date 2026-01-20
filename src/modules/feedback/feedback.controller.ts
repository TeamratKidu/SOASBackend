import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@ApiTags('feedback')
@Controller('feedback')
@UseGuards(BetterAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Post()
  @ApiOperation({ summary: 'Leave feedback for a completed auction' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or auction not completed',
  })
  @ApiResponse({ status: 403, description: 'Not authorized to leave feedback' })
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Request() req) {
    return this.feedbackService.create(createFeedbackDto, req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get feedback received by a user' })
  @ApiResponse({ status: 200, description: 'Feedback list returned' })
  async getFeedbackForUser(@Param('userId') userId: string) {
    return this.feedbackService.getFeedbackForUser(userId);
  }

  @Get('user/:userId/rating')
  @ApiOperation({ summary: 'Get average rating for a user' })
  @ApiResponse({ status: 200, description: 'Average rating returned' })
  async getAverageRating(@Param('userId') userId: string) {
    return this.feedbackService.getAverageRating(userId);
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get feedback for a specific auction' })
  @ApiResponse({ status: 200, description: 'Auction feedback returned' })
  async getFeedbackForAuction(@Param('auctionId') auctionId: string) {
    return this.feedbackService.getFeedbackForAuction(auctionId);
  }
}

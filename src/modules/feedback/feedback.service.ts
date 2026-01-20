import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../lib/auth';
import { feedback, auction, user } from '../../database/schema';
import { eq, and, desc, sql, count, avg } from 'drizzle-orm';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor() {}

  /**
   * Create feedback for a completed auction
   */
  async create(createFeedbackDto: CreateFeedbackDto, fromUserId: string) {
    const { auctionId, toUserId, rating, comment } = createFeedbackDto;

    // Verify auction exists and is paid
    const foundAuction = await db.query.auction.findFirst({
      where: eq(auction.id, auctionId),
    });

    if (!foundAuction) {
      throw new NotFoundException('Auction not found');
    }

    if (foundAuction.status !== 'paid') {
      throw new BadRequestException(
        'Can only leave feedback for completed auctions',
      );
    }

    // Verify user is involved in the auction (either seller or winner)
    const isInvolved =
      foundAuction.sellerId === fromUserId ||
      foundAuction.winnerId === fromUserId;
    if (!isInvolved) {
      throw new ForbiddenException(
        'You can only leave feedback for auctions you participated in',
      );
    }

    // Verify toUserId is the other party
    const validToUser =
      (foundAuction.sellerId === fromUserId &&
        foundAuction.winnerId === toUserId) ||
      (foundAuction.winnerId === fromUserId &&
        foundAuction.sellerId === toUserId);

    if (!validToUser) {
      throw new BadRequestException('Invalid feedback recipient');
    }

    // Check if feedback already exists
    const [existingFeedback] = await db.query.feedback.findMany({
      where: and(
        eq(feedback.auctionId, auctionId),
        eq(feedback.fromUserId, fromUserId),
        eq(feedback.toUserId, toUserId),
      ),
      limit: 1,
    });

    if (existingFeedback) {
      throw new BadRequestException(
        'You have already left feedback for this auction',
      );
    }

    // Create feedback
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        auctionId,
        fromUserId,
        toUserId,
        rating,
        comment,
      })
      .returning();

    return newFeedback;
  }

  /**
   * Get feedback received by a user
   */
  async getFeedbackForUser(userId: string) {
    const result = await db.query.feedback.findMany({
      where: eq(feedback.toUserId, userId),
      with: {
        fromUser: true,
        auction: true,
      },
      orderBy: [desc(feedback.createdAt)],
    });

    return result.map((f) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt,
      fromUser: {
        id: f.fromUser.id,
        username: f.fromUser.name,
      },
      auction: {
        id: f.auction.id,
        title: f.auction.title,
      },
    }));
  }

  /**
   * Get average rating for a user
   */
  async getAverageRating(
    userId: string,
  ): Promise<{ averageRating: number; totalFeedback: number }> {
    const [result] = await db
      .select({
        averageRating: avg(feedback.rating),
        totalFeedback: count(feedback.id),
      })
      .from(feedback)
      .where(eq(feedback.toUserId, userId));

    return {
      averageRating: parseFloat(result?.averageRating || '0'),
      totalFeedback: result?.totalFeedback || 0,
    };
  }

  /**
   * Get feedback for a specific auction
   */
  async getFeedbackForAuction(auctionId: string) {
    return db.query.feedback.findMany({
      where: eq(feedback.auctionId, auctionId),
      with: {
        fromUser: true,
        toUser: true,
      },
      orderBy: [desc(feedback.createdAt)],
    });
  }
}

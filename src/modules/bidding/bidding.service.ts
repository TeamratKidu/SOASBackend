import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../../lib/auth';
import { bid, auction, user } from '../../database/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BiddingService {
  constructor(private readonly auditService: AuditService) { }

  private maskName(name: string): string {
    return name.length > 3
      ? `${name.substring(0, 2)}***${name.substring(name.length - 1)}`
      : `${name}***`;
  }

  /**
   * Place a bid with SERIALIZABLE/locking transaction
   * Implements BR-01 and BR-02
   */
  async placeBid(auctionId: string, bidderId: string, amount: number) {
    // Use Drizzle transaction. We use a pessimistic lock (FOR UPDATE) which effectively enforces ordering
    // even without strict SERIALIZABLE isolation at DB level, but we can stick to defaults or configure if needed.
    // Postgres FOR UPDATE blocks concurrent writes to the same row.

    return await db.transaction(async (tx) => {
      // 1. SELECT FOR UPDATE on auction row
      const [foundAuction] = await tx
        .select()
        .from(auction)
        .where(eq(auction.id, auctionId))
        .for('update'); // This provides the lock needed to prevent race conditions

      if (!foundAuction) {
        throw new NotFoundException('Auction not found');
      }

      // 2. Validate auction is active
      if (foundAuction.status !== 'active') {
        throw new BadRequestException('Auction is not active');
      }

      // 3. Check if auction has ended
      const now = new Date();
      if (foundAuction.endTime < now) {
        throw new BadRequestException('Auction has ended');
      }

      // 4. Prevent seller from bidding on own auction
      if (foundAuction.sellerId === bidderId) {
        throw new ForbiddenException('Cannot bid on your own auction');
      }

      // 5. Validate bid amount
      // Handle decimal conversion safely
      const currentPrice = parseFloat(
        foundAuction.currentPrice as unknown as string,
      );
      const minimumIncrement = parseFloat(
        foundAuction.minimumIncrement as unknown as string,
      );
      const minimumBid = currentPrice + minimumIncrement;

      if (amount < minimumBid) {
        // Ensure nice formatting for error message
        throw new BadRequestException(
          `Bid must be at least ETB ${minimumBid.toFixed(2)} (current price + increment)`,
        );
      }

      // 6. Create and save bid
      const [newBid] = await tx
        .insert(bid)
        .values({
          auctionId,
          bidderId,
          amount: amount.toString(),
        })
        .returning();

      // 7. Prepare update data
      const updateData: any = {
        currentPrice: amount.toString(),
        winnerId: bidderId,
      };

      // 8. ANTI-SNIPING ALGORITHM (BR-02)
      const timeRemaining = foundAuction.endTime.getTime() - now.getTime();
      const twoMinutesInMs = 2 * 60 * 1000;
      let wasExtended = false;

      if (timeRemaining < twoMinutesInMs) {
        const newEndTime = new Date(now.getTime() + twoMinutesInMs);
        updateData.endTime = newEndTime;
        wasExtended = true;
        console.log(`⏰ Auction ${auctionId} extended to ${newEndTime}`);
      }

      // 9. Update Auction
      const [updatedAuction] = await tx
        .update(auction)
        .set(updateData)
        .where(eq(auction.id, auctionId))
        .returning();

      // 10. Audit Log
      await this.auditService.log(
        'BID_PLACED',
        bidderId,
        newBid.id,
        undefined,
        { auctionId, amount, wasExtended },
      );

      // 11. Fetch bidder details for masking
      const bidder = await tx.query.user.findFirst({
        where: eq(user.id, bidderId),
      });

      const name = bidder?.name || bidder?.email || 'Anonymous';
      const maskedName = this.maskName(name);

      // Return shape matching legacy service for Gateway compatibility
      return {
        bid: {
          ...newBid,
          amount: parseFloat(newBid.amount as unknown as string),
          bidder: {
            username: maskedName
          }
        },
        auction: {
          id: updatedAuction.id,
          currentPrice: parseFloat(
            updatedAuction.currentPrice as unknown as string,
          ),
          endTime: updatedAuction.endTime,
          winnerId: updatedAuction.winnerId,
        },
        wasExtended,
      };
    });
  }

  /**
   * Get bid history for an auction
   */
  async getBidHistory(auctionId: string, limit = 50) {
    const bids = await db.query.bid.findMany({
      where: eq(bid.auctionId, auctionId),
      orderBy: [desc(bid.timestamp)],
      limit: limit,
      with: {
        bidder: true,
      },
    });

    return bids.map((item) => {
      const name = item.bidder.name || item.bidder.email || 'Anonymous';
      const maskedName = this.maskName(name);

      return {
        id: item.id,
        amount: parseFloat(item.amount as unknown as string),
        timestamp: item.timestamp,
        bidder: {
          id: item.bidder.id,
          username: maskedName,
        },
      };
    });
  }

  /**
   * Get user's bids
   */
  async getUserBids(userId: string) {
    return db.query.bid.findMany({
      where: eq(bid.bidderId, userId),
      with: {
        auction: true,
      },
      orderBy: [desc(bid.timestamp)],
    });
  }
}

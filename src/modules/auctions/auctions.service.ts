import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, or, ilike, desc, lte, sql, count, avg } from 'drizzle-orm';
import { db } from '../../lib/auth';
import { auction, user } from '../../database/schema';
import {
  CreateAuctionDto,
  UpdateAuctionDto,
  AuctionFilterDto,
} from './dto/auction.dto';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuctionsService {
  constructor(private readonly auditService: AuditService) { }

  async create(createAuctionDto: CreateAuctionDto, sellerId: string) {
    // Validate end time is at least 1 hour from now
    const endTime = new Date(createAuctionDto.endTime);
    const minEndTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    if (endTime < minEndTime) {
      throw new BadRequestException('Auction must run for at least 1 hour');
    }

    const [newAuction] = await db
      .insert(auction)
      .values({
        title: createAuctionDto.title,
        description: createAuctionDto.description,
        startingPrice: createAuctionDto.startingPrice.toString(), // Drizzle decimal needs string
        currentPrice: createAuctionDto.startingPrice.toString(),
        minimumIncrement: (createAuctionDto.minimumIncrement || 100).toString(),
        reservePrice: createAuctionDto.reservePrice?.toString(),
        endTime: endTime,
        category: createAuctionDto.category || '',
        status: 'pending',
        imageUrls: createAuctionDto.imageUrls || [],
        attachments: createAuctionDto.attachments || [],
        sellerId: sellerId,
      })
      .returning();

    await this.auditService.log(
      'AUCTION_CREATED',
      sellerId,
      newAuction.id,
      undefined,
      { title: newAuction.title },
    );

    return newAuction;
  }

  async findAll(filterDto: AuctionFilterDto) {
    const {
      status,
      minPrice,
      maxPrice,
      search,
      category,
      page = 1,
      limit = 20,
    } = filterDto;

    const filters: import('drizzle-orm').SQL[] = [];

    if (status) {
      // @ts-ignore - enum validation might be tricky with strings
      filters.push(eq(auction.status, status));
    }

    if (minPrice !== undefined) {
      filters.push(sql`${auction.currentPrice} >= ${minPrice}`);
    }
    if (maxPrice !== undefined) {
      filters.push(sql`${auction.currentPrice} <= ${maxPrice}`);
    }

    if (search) {
      filters.push(
        or(
          ilike(auction.title, `%${search}%`),
          ilike(auction.description, `%${search}%`),
        )!,
      );
    }

    if (category) {
      filters.push(eq(auction.category, category));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Count total
    const [totalResult] = await db
      .select({ count: count() })
      .from(auction)
      .where(whereClause);

    const total = totalResult?.count || 0;

    // Fetch data
    const auctions = await db.query.auction.findMany({
      where: whereClause,
      with: {
        seller: {
          columns: {
            id: true,
            name: true, // Assuming name exists, or use email/username from schema
            email: true,
          },
        },
      },
      limit: limit,
      offset: (page - 1) * limit,
      orderBy: [desc(auction.createdAt)],
    });

    return {
      data: auctions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const foundAuction = await db.query.auction.findFirst({
      where: eq(auction.id, id),
      with: {
        seller: true,
        winner: true,
      },
    });

    if (!foundAuction) {
      throw new NotFoundException('Auction not found');
    }

    return foundAuction;
  }

  async update(
    id: string,
    updateAuctionDto: UpdateAuctionDto,
    userId: string,
    userRole: string,
  ) {
    const foundAuction = await this.findOne(id);

    // Only seller can update their own auction
    if (foundAuction.sellerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only update your own auctions');
    }

    // Cannot update if auction is not pending
    if (foundAuction.status !== 'pending') {
      throw new BadRequestException('Can only update pending auctions');
    }

    // Prepare update data
    const updateData: any = { ...updateAuctionDto };
    if (updateData.startingPrice)
      updateData.startingPrice = updateData.startingPrice.toString();
    if (updateData.reservePrice)
      updateData.reservePrice = updateData.reservePrice.toString();
    if (updateData.minimumIncrement)
      updateData.minimumIncrement = updateData.minimumIncrement.toString();

    const [updatedAuction] = await db
      .update(auction)
      .set(updateData)
      .where(eq(auction.id, id))
      .returning();

    await this.auditService.log(
      'AUCTION_UPDATED',
      userId,
      id,
      undefined,
      updateData,
    );

    return updatedAuction;
  }

  async approve(id: string) {
    const foundAuction = await this.findOne(id);

    if (foundAuction.status !== 'pending') {
      throw new BadRequestException('Only pending auctions can be approved');
    }

    const [updatedAuction] = await db
      .update(auction)
      .set({ status: 'active' })
      .where(eq(auction.id, id))
      .returning();

    // Admin approval log - user ID not passed here currently, assuming system or context needs to be improved
    // For now logging as "system" or undefined user
    await this.auditService.log('AUCTION_APPROVED', undefined, id, undefined, {
      status: 'active',
    });

    return updatedAuction;
  }

  async cancel(id: string, reason?: string) {
    const foundAuction = await this.findOne(id);

    if (foundAuction.status === 'paid' || foundAuction.status === 'cancelled') {
      throw new BadRequestException('Cannot cancel this auction');
    }

    const [updatedAuction] = await db
      .update(auction)
      .set({ status: 'cancelled' })
      .where(eq(auction.id, id))
      .returning();

    await this.auditService.log('AUCTION_CANCELLED', undefined, id, undefined, {
      reason,
    });

    return updatedAuction;
  }

  async findByUser(userId: string, role: string) {
    const whereClause =
      role === 'seller'
        ? eq(auction.sellerId, userId)
        : eq(auction.winnerId, userId);

    return db.query.auction.findMany({
      where: whereClause,
      orderBy: [desc(auction.createdAt)],
    });
  }

  async findByCategory(category: string) {
    return db.query.auction.findMany({
      where: and(eq(auction.category, category), eq(auction.status, 'active')),
      orderBy: [desc(auction.createdAt)],
    });
  }

  // Cron job to check for expired auctions every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredAuctions() {
    const now = new Date();

    // Find all active auctions that have ended
    const expiredAuctions = await db.query.auction.findMany({
      where: and(eq(auction.status, 'active'), lte(auction.endTime, now)),
    });

    for (const item of expiredAuctions) {
      // Check if reserve price was met
      // Note: Decimal comes as string from Drizzle query
      const currentPrice = parseFloat(item.currentPrice as unknown as string);
      const reservePrice = item.reservePrice
        ? parseFloat(item.reservePrice as unknown as string)
        : 0;

      if (reservePrice > 0 && currentPrice < reservePrice) {
        // Reserve not met, cancel auction
        await db
          .update(auction)
          .set({ status: 'cancelled' })
          .where(eq(auction.id, item.id));
        console.log(`🚫 Auction ${item.id} cancelled - reserve price not met`);
      } else {
        // Auction ended successfully
        await db
          .update(auction)
          .set({ status: 'ended' })
          .where(eq(auction.id, item.id));
        console.log(`⏰ Auction ${item.id} ended`);
      }
    }

    if (expiredAuctions.length > 0) {
      console.log(`✅ Processed ${expiredAuctions.length} expired auctions`);
    }
  }

  async getCategoryStatistics() {
    // Simple aggregate query using Drizzle
    const stats = await db
      .select({
        category: auction.category,
        count: count(auction.id),
        avgPrice: avg(auction.currentPrice),
      })
      .from(auction)
      .where(eq(auction.status, 'active'))
      .groupBy(auction.category);

    return stats.map((stat) => ({
      category: stat.category,
      count: stat.count,
      avgPrice: parseFloat(stat.avgPrice || '0'),
    }));
  }
}

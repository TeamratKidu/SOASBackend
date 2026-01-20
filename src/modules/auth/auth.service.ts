import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../../lib/auth'; // Import Drizzle instance
import { user, bid, auction } from '../../database/schema';
import { eq, sql, and } from 'drizzle-orm';
import { UpdateProfileDto, UpgradeToSellerDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor() { }

  /**
   * Upgrade a user to SELLER role with KYC information
   * Requires admin approval via sellerApprovalStatus
   */
  async upgradeToSeller(userId: string, upgradeData: UpgradeToSellerDto) {
    // Find user by ID
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    if (foundUser.role === 'seller') {
      throw new BadRequestException('User is already a seller');
    }

    if (foundUser.role === 'admin') {
      throw new BadRequestException('Admin cannot be downgraded to seller');
    }

    // Update user with seller information and set status to pending
    await db
      .update(user)
      .set({
        bio: upgradeData.bio,
        tinNumber: upgradeData.tinNumber,
        faydaId: upgradeData.faydaId,
        location: upgradeData.location,
        image: upgradeData.image || foundUser.image,
        sellerApprovalStatus: 'pending', // Requires admin approval
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return {
      message: 'Seller upgrade request submitted. Awaiting admin approval.',
      user: {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        sellerApprovalStatus: 'pending',
      },
    };
  }

  /**
   * Admin approves seller upgrade request
   */
  async approveSellerUpgrade(userId: string) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    if (foundUser.sellerApprovalStatus !== 'pending') {
      throw new BadRequestException('No pending seller upgrade request');
    }

    // Approve and upgrade to seller
    await db
      .update(user)
      .set({
        role: 'seller',
        sellerApprovalStatus: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return {
      message: 'Seller upgrade approved successfully',
      user: {
        id: foundUser.id,
        email: foundUser.email,
        role: 'seller',
      },
    };
  }

  /**
   * Admin rejects seller upgrade request
   */
  async rejectSellerUpgrade(userId: string, reason?: string) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    if (foundUser.sellerApprovalStatus !== 'pending') {
      throw new BadRequestException('No pending seller upgrade request');
    }

    // Reject upgrade
    await db
      .update(user)
      .set({
        sellerApprovalStatus: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return {
      message: 'Seller upgrade rejected',
      reason: reason || 'Not specified',
    };
  }

  async getProfile(userId: string) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    // Calculate stats
    // 1. Total Bids
    const bidCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bid)
      .where(eq(bid.bidderId, userId));
    const totalBids = Number(bidCountResult[0]?.count || 0);

    // 2. Won Auctions
    const wonCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auction)
      .where(
        and(
          eq(auction.winnerId, userId),
          // status is enum, need to check if ended or paid
          // We can use sql for simple check or import enum
          sql`${auction.status} IN ('ended', 'paid')`,
        ),
      );
    const wonAuctions = Number(wonCountResult[0]?.count || 0);

    return {
      ...foundUser,
      totalBids,
      wonAuctions,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return this.getProfile(userId);
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { db } from '../../lib/auth';
import { transaction, auction, user } from '../../database/schema';
import { eq, and, lt, sql, desc } from 'drizzle-orm';

@Injectable()
export class PaymentsService {
  constructor(private configService: ConfigService) { }

  /**
   * Initialize payment with Chapa
   */
  async initializePayment(auctionId: string, userId: string) {
    const foundAuction = await db.query.auction.findFirst({
      where: eq(auction.id, auctionId),
    });

    if (!foundAuction) {
      throw new NotFoundException('Auction not found');
    }

    if (foundAuction.status !== 'ended') {
      throw new BadRequestException('Auction has not ended yet');
    }

    if (foundAuction.winnerId !== userId) {
      throw new BadRequestException('You are not the winner of this auction');
    }

    // Create transaction record
    const [newTransaction] = await db
      .insert(transaction)
      .values({
        auctionId,
        userId,
        amount: foundAuction.currentPrice,
        gateway: 'chapa',
        status: 'pending',
      })
      .returning();

    // Generate Chapa payment URL (sandbox)
    const chapaUrl = await this.generateChapaPaymentUrl(newTransaction);

    return {
      transactionId: newTransaction.id,
      paymentUrl: chapaUrl,
      amount: newTransaction.amount,
      gateway: 'chapa',
    };
  }

  /**
   * Generate Chapa payment URL
   * (Kept as is, just updated type if needed, but 'transaction' is now from schema/inferred)
   */
  private async generateChapaPaymentUrl(tx: typeof transaction.$inferSelect) {
    const chapaPublicKey = this.configService.get('CHAPA_PUBLIC_KEY');
    const returnUrl = `${this.configService.get('FRONTEND_URL')}/payment/success`;
    const callbackUrl = `${this.configService.get('FRONTEND_URL')}/api/payments/webhook/chapa`;

    // Chapa payment initialization (sandbox)
    const paymentData = {
      amount: tx.amount,
      currency: 'ETB',
      email: 'winner@example.com', // Should be actual user email, TODO: fetch user email
      first_name: 'Auction',
      last_name: 'Winner',
      tx_ref: tx.id,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: 'SOAS Auction Payment',
        description: `Payment for auction ${tx.auctionId}`,
      },
    };

    // In production, make actual API call to Chapa
    // For now, return mock URL
    const mockUrl = `https://checkout.chapa.co/checkout/payment/${tx.id}`;

    console.log('💳 Chapa payment initialized:', paymentData);

    return mockUrl;
  }

  /**
   * Handle Chapa webhook
   */
  async handleChapaWebhook(payload: any, signature: string) {
    // Verify webhook signature
    const isValid = this.verifyChapaSignature(payload, signature);

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { tx_ref, status } = payload;

    const foundTransaction = await db.query.transaction.findFirst({
      where: eq(transaction.id, tx_ref),
      with: { auction: true },
    });

    if (!foundTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (status === 'success') {
      await db
        .update(transaction)
        .set({
          status: 'success',
          paidAt: new Date(),
          gatewayReference: payload.reference || payload.trx_ref,
        })
        .where(eq(transaction.id, tx_ref));

      // Update auction status to PAID
      await db
        .update(auction)
        .set({ status: 'paid' })
        .where(eq(auction.id, foundTransaction.auctionId));

      console.log(
        `✅ Payment successful for auction ${foundTransaction.auctionId}`,
      );

      return { success: true, message: 'Payment processed successfully' };
    } else {
      await db
        .update(transaction)
        .set({ status: 'failed' })
        .where(eq(transaction.id, tx_ref));

      console.log(
        `❌ Payment failed for auction ${foundTransaction.auctionId}`,
      );

      return { success: false, message: 'Payment failed' };
    }
  }

  /**
   * Verify Chapa webhook signature
   */
  private verifyChapaSignature(payload: any, signature: string): boolean {
    const secret = this.configService.get('CHAPA_WEBHOOK_SECRET');

    if (!secret) {
      console.warn(
        '⚠️ CHAPA_WEBHOOK_SECRET not configured, skipping verification',
      );
      return true; // Allow in development
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Check for unpaid auctions and block users (BR-06)
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkUnpaidAuctions() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find ended auctions that haven't been paid within 24 hours
    // and were updated before 24 hours ago (meaning they ended > 24h ago)
    const unpaidAuctions = await db.query.auction.findMany({
      where: and(
        eq(auction.status, 'ended'),
        lt(auction.updatedAt, twentyFourHoursAgo),
      ),
    });

    for (const item of unpaidAuctions) {
      if (item.winnerId) {
        const previousWinnerId = item.winnerId;

        // Re-open auction
        await db
          .update(auction)
          .set({
            status: 'active',
            winnerId: null,
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Extend by 24 hours
          })
          .where(eq(auction.id, item.id));

        // Increment unpaid count for user
        const foundUser = await db.query.user.findFirst({
          where: eq(user.id, previousWinnerId),
        });

        if (foundUser) {
          const newCount = (foundUser.unpaidAuctionsCount || 0) + 1;
          const updateData: any = { unpaidAuctionsCount: newCount };

          // Block user if they have 3 or more unpaid auctions (BR-06)
          if (newCount >= 3) {
            updateData.isActive = false;
            console.log(
              `🚫 User ${foundUser.id} blocked for ${newCount} unpaid auctions`,
            );
          }

          await db
            .update(user)
            .set(updateData)
            .where(eq(user.id, previousWinnerId));
        }

        console.log(`🔄 Auction ${item.id} re-opened due to non-payment`);
      }
    }
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(userId: string) {
    return db.query.transaction.findMany({
      where: eq(transaction.userId, userId),
      with: { auction: true },
      orderBy: [desc(transaction.createdAt)],
    });
  }
}

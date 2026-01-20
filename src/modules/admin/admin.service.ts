import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../lib/auth';
import { user, auditLog } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
    constructor(private readonly auditService: AuditService) { }

    /**
     * Get all users who have applied to become sellers (pending approval)
     */
    async getPendingSellers() {
        const pendingSellers = await db.query.user.findMany({
            where: eq(user.sellerApprovalStatus, 'pending'),
            columns: {
                id: true,
                name: true,
                email: true,
                image: true,
                tinNumber: true,
                faydaId: true,
                location: true,
                bio: true,
                createdAt: true,
            },
        });

        return pendingSellers;
    }

    /**
     * Approve a seller upgrade request
     */
    async approveSeller(userId: string, adminId?: string) {
        // Check if user exists
        const foundUser = await db.query.user.findFirst({
            where: eq(user.id, userId),
        });

        if (!foundUser) {
            throw new NotFoundException('User not found');
        }

        // Check if already approved or not pending
        if (foundUser.sellerApprovalStatus !== 'pending') {
            throw new BadRequestException(
                `User seller status is already ${foundUser.sellerApprovalStatus}`,
            );
        }

        // Update user to seller role and approve status
        const [updatedUser] = await db
            .update(user)
            .set({
                role: 'seller',
                sellerApprovalStatus: 'approved',
            })
            .where(eq(user.id, userId))
            .returning();

        // Log the approval action
        await this.auditService.log(
            'SELLER_APPROVED',
            adminId || 'system',
            userId,
            undefined,
            {
                userName: foundUser.name,
                userEmail: foundUser.email,
            },
        );

        return {
            success: true,
            message: 'Seller approved successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        };
    }

    /**
     * Reject a seller upgrade request
     */
    async rejectSeller(userId: string, reason: string, adminId?: string) {
        // Check if user exists
        const foundUser = await db.query.user.findFirst({
            where: eq(user.id, userId),
        });

        if (!foundUser) {
            throw new NotFoundException('User not found');
        }

        // Check if pending
        if (foundUser.sellerApprovalStatus !== 'pending') {
            throw new BadRequestException(
                `User seller status is already ${foundUser.sellerApprovalStatus}`,
            );
        }

        // Update status to rejected
        const [updatedUser] = await db
            .update(user)
            .set({
                sellerApprovalStatus: 'rejected',
            })
            .where(eq(user.id, userId))
            .returning();

        // Log the rejection action
        await this.auditService.log(
            'SELLER_REJECTED',
            adminId || 'system',
            userId,
            undefined,
            {
                userName: foundUser.name,
                userEmail: foundUser.email,
                reason,
            },
        );

        return {
            success: true,
            message: 'Seller request rejected',
            reason,
        };
    }

    /**
     * Get all users (for user management)
     */
    async getAllUsers() {
        const users = await db.query.user.findMany({
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: (users, { desc }) => [desc(users.createdAt)],
        });

        return users;
    }

    /**
     * Block a user (sets isActive to false)
     */
    async blockUser(userId: string, reason: string, adminId?: string) {
        const foundUser = await db.query.user.findFirst({
            where: eq(user.id, userId),
        });

        if (!foundUser) {
            throw new NotFoundException('User not found');
        }

        const [updatedUser] = await db
            .update(user)
            .set({
                isActive: false,
            })
            .where(eq(user.id, userId))
            .returning();

        await this.auditService.log(
            'USER_BLOCKED',
            adminId || 'system',
            userId,
            undefined,
            {
                userName: foundUser.name,
                reason,
            },
        );

        return {
            success: true,
            message: 'User blocked successfully',
        };
    }

    /**
     * Unblock a user (sets isActive to true)
     */
    async unblockUser(userId: string, adminId?: string) {
        const foundUser = await db.query.user.findFirst({
            where: eq(user.id, userId),
        });

        if (!foundUser) {
            throw new NotFoundException('User not found');
        }

        const [updatedUser] = await db
            .update(user)
            .set({
                isActive: true,
            })
            .where(eq(user.id, userId))
            .returning();

        await this.auditService.log(
            'USER_UNBLOCKED',
            adminId || 'system',
            userId,
            undefined,
            {
                userName: foundUser.name,
            },
        );

        return {
            success: true,
            message: 'User unblocked successfully',
        };
    }
}

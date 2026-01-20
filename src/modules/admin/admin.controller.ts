import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { AdminService } from './admin.service';
import { db } from '../../lib/auth';
import { user } from '../../database/schema';
import { eq, desc, count } from 'drizzle-orm';

@ApiTags('admin')
@Controller('admin')
@UseGuards(BetterAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private auditService: AuditService,
    private authService: AuthService,
    private adminService: AdminService,
  ) { }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    // Ensure page/limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Count total users
    const [totalResult] = await db.select({ count: count() }).from(user);
    const total = totalResult?.count || 0;

    // Fetch users
    const users = await db.query.user.findMany({
      limit: limitNum,
      offset: skip,
      orderBy: [desc(user.createdAt)],
    });

    return {
      data: users.map((u) => ({
        id: u.id,
        username: u.name, // Better-Auth uses 'name'
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        unpaidAuctionsCount: u.unpaidAuctionsCount,
        sellerApprovalStatus: u.sellerApprovalStatus,
        tinNumber: u.tinNumber,
        faydaId: u.faydaId,
        createdAt: u.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('seller-requests')
  @ApiOperation({ summary: 'Get pending seller upgrade requests (Admin only)' })
  async getPendingSellerRequests() {
    return this.adminService.getPendingSellers();
  }

  @Get('pending-sellers')
  @ApiOperation({ summary: 'Get pending seller approvals (Admin only)' })
  async getPendingSellers() {
    return this.adminService.getPendingSellers();
  }

  @Patch('seller-requests/:id/approve')
  @ApiOperation({ summary: 'Approve seller upgrade request (Admin only)' })
  async approveSellerRequest(@Param('id') id: string) {
    return this.adminService.approveSeller(id);
  }

  @Post('sellers/:id/approve')
  @ApiOperation({ summary: 'Approve seller (Admin only)' })
  async approveSeller(@Param('id') id: string) {
    return this.adminService.approveSeller(id);
  }

  @Patch('seller-requests/:id/reject')
  @ApiOperation({ summary: 'Reject seller upgrade request (Admin only)' })
  async rejectSellerRequest(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectSeller(id, reason || 'Not specified');
  }

  @Post('sellers/:id/reject')
  @ApiOperation({ summary: 'Reject seller (Admin only)' })
  async rejectSeller(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectSeller(id, reason || 'Not specified');
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: 'Block user (Admin only)' })
  async blockUser(@Param('id') id: string) {
    const [foundUser] = await db.query.user.findMany({
      where: eq(user.id, id),
      limit: 1,
    });

    if (!foundUser) {
      throw new NotFoundException('User not found'); // Use generic exception
    }

    await db.update(user).set({ isActive: false }).where(eq(user.id, id));

    // TODO: AuditService refactor check needed?
    // passing foundUser.name as username
    await this.auditService.log('USER_BLOCKED', undefined, id, undefined, {
      username: foundUser.name,
    });

    return { message: 'User blocked successfully' };
  }

  @Patch('users/:id/unblock')
  @ApiOperation({ summary: 'Unblock user (Admin only)' })
  async unblockUser(@Param('id') id: string) {
    const [foundUser] = await db.query.user.findMany({
      where: eq(user.id, id),
      limit: 1,
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    await db
      .update(user)
      .set({ isActive: true, unpaidAuctionsCount: 0 })
      .where(eq(user.id, id));

    await this.auditService.log('USER_UNBLOCKED', undefined, id, undefined, {
      username: foundUser.name,
    });

    return { message: 'User unblocked successfully' };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getLogs(Number(page), Number(limit), {
      userId,
      action,
    });
  }
}

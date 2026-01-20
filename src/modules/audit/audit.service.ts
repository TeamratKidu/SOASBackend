import { Injectable } from '@nestjs/common';
import { db } from '../../lib/auth';
import { auditLog, user } from '../../database/schema';
import { eq, desc, count, and, gte, lte } from 'drizzle-orm';

@Injectable()
export class AuditService {
  constructor() {}

  /**
   * Log an action (write-only)
   */
  async log(
    action: string,
    userId?: string,
    entityId?: string,
    ipAddress?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    await db.insert(auditLog).values({
      userId,
      action,
      entityId,
      ipAddress,
      details,
    });

    console.log(`📝 Audit: ${action} by user ${userId || 'system'}`);
  }

  /**
   * Get audit logs (admin only)
   */
  async getLogs(
    page = 1,
    limit = 50,
    filters?: {
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const filtersList: import('drizzle-orm').SQL[] = [];

    if (filters?.userId) {
      filtersList.push(eq(auditLog.userId, filters.userId));
    }

    if (filters?.action) {
      filtersList.push(eq(auditLog.action, filters.action));
    }

    if (filters?.startDate) {
      filtersList.push(gte(auditLog.timestamp, filters.startDate));
    }

    if (filters?.endDate) {
      filtersList.push(lte(auditLog.timestamp, filters.endDate));
    }

    const whereClause =
      filtersList.length > 0 ? and(...filtersList) : undefined;

    // Count total
    const [totalResult] = await db
      .select({ count: count() })
      .from(auditLog)
      .where(whereClause);

    const total = totalResult?.count || 0;

    // Fetch logs
    const logs = await db.query.auditLog.findMany({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      orderBy: [desc(auditLog.timestamp)],
      with: {
        user: true,
      },
    });

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

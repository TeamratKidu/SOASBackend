import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  varchar,
  decimal,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Enums ---
export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export const userRoleEnum = pgEnum('user_role', ['buyer', 'seller', 'admin']);
export const auctionStatusEnum = pgEnum('auction_status', [
  'pending',
  'active',
  'ended',
  'paid',
  'cancelled',
]);
export const paymentGatewayEnum = pgEnum('payment_gateway', [
  'chapa',
  'telebirr',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'success',
  'failed',
  'cancelled',
]);

// --- Better Auth Core Tables ---

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),

  // Custom Fields (migrated from legacy User entity)
  role: text('role').default('buyer'),
  phone: text('phone'),
  phoneVerified: boolean('phoneVerified').default(false),
  trustScore: integer('trustScore').default(0),
  unpaidAuctionsCount: integer('unpaidAuctionsCount').default(0),
  isActive: boolean('isActive').default(true),
  failedLogins: integer('failedLogins').default(0),
  lockedUntil: timestamp('lockedUntil'),
  notifications: jsonb('notifications'),

  // Seller-specific fields for AxumAuction
  bio: text('bio'),
  tinNumber: text('tinNumber'), // Ethiopian Tax Identification Number
  faydaId: text('faydaId'), // Fayda Alliance Number (FAN) or Fayda Identification Number (FIN)
  location: text('location'),
  sellerApprovalStatus: text('sellerApprovalStatus').default('pending'), // pending, approved, rejected
});

export const session = pgTable('session', {
  id: text('id').primaryKey(), // Changed from uuid to text
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(), // Changed from uuid to text
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(), // Changed from uuid to text
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// --- Application Tables ---

export const auction = pgTable('auctions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  startingPrice: decimal('starting_price', {
    precision: 10,
    scale: 2,
  }).notNull(),
  currentPrice: decimal('current_price', { precision: 10, scale: 2 }).notNull(),
  minimumIncrement: decimal('minimum_increment', { precision: 10, scale: 2 })
    .default('100')
    .notNull(),
  reservePrice: decimal('reserve_price', { precision: 10, scale: 2 }),
  endTime: timestamp('end_time').notNull(),
  category: text('category'),
  status: auctionStatusEnum('status').default('pending').notNull(),
  imageUrls: varchar('imageUrls').array().default([]),
  attachments: jsonb('attachments').default([]),
  sellerId: text('seller_id')
    .notNull()
    .references(() => user.id),
  winnerId: text('winner_id').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bid = pgTable('bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  auctionId: uuid('auction_id')
    .notNull()
    .references(() => auction.id),
  bidderId: text('bidder_id')
    .notNull()
    .references(() => user.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const transaction = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  auctionId: uuid('auction_id')
    .notNull()
    .references(() => auction.id),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  status: transactionStatusEnum('status').default('pending').notNull(),
  gatewayReference: jsonb('gateway_reference'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLog = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id),
  action: varchar('action', { length: 255 }).notNull(),
  entityId: uuid('entity_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  auctionId: uuid('auction_id')
    .notNull()
    .references(() => auction.id),
  fromUserId: text('from_user_id')
    .notNull()
    .references(() => user.id),
  toUserId: text('to_user_id')
    .notNull()
    .references(() => user.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
  auctions: many(auction, { relationName: 'sellerAuctions' }),
  wonAuctions: many(auction, { relationName: 'winnerAuctions' }),
  bids: many(bid),
  transactions: many(transaction),
  auditLogs: many(auditLog),
  feedbackGiven: many(feedback, { relationName: 'feedbackGiven' }),
  feedbackReceived: many(feedback, { relationName: 'feedbackReceived' }),
}));

export const auctionRelations = relations(auction, ({ one, many }) => ({
  seller: one(user, {
    fields: [auction.sellerId],
    references: [user.id],
    relationName: 'sellerAuctions',
  }),
  winner: one(user, {
    fields: [auction.winnerId],
    references: [user.id],
    relationName: 'winnerAuctions',
  }),
  bids: many(bid),
  transactions: many(transaction),
  feedback: many(feedback),
}));

export const bidRelations = relations(bid, ({ one }) => ({
  auction: one(auction, {
    fields: [bid.auctionId],
    references: [auction.id],
  }),
  bidder: one(user, {
    fields: [bid.bidderId],
    references: [user.id],
  }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  auction: one(auction, {
    fields: [transaction.auctionId],
    references: [auction.id],
  }),
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  auction: one(auction, {
    fields: [feedback.auctionId],
    references: [auction.id],
  }),
  fromUser: one(user, {
    fields: [feedback.fromUserId],
    references: [user.id],
    relationName: 'feedbackGiven',
  }),
  toUser: one(user, {
    fields: [feedback.toUserId],
    references: [user.id],
    relationName: 'feedbackReceived',
  }),
}));

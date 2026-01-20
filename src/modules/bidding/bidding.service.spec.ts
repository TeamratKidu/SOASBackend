import { Test, TestingModule } from '@nestjs/testing';
import { BiddingService } from './bidding.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Mock the database
jest.mock('../../lib/auth', () => ({
    db: {
        transaction: jest.fn(),
        query: {
            bid: {
                findMany: jest.fn(),
            },
        },
    },
}));

describe('BiddingService', () => {
    let service: BiddingService;
    let auditService: AuditService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BiddingService,
                {
                    provide: AuditService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BiddingService>(BiddingService);
        auditService = module.get<AuditService>(AuditService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('placeBid', () => {
        it('should reject bid if auction not found', async () => {
            const { db } = require('../../lib/auth');
            db.transaction.mockImplementation(async (callback) => {
                return callback({
                    select: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    for: jest.fn().mockResolvedValue([]), // No auction found
                });
            });

            await expect(
                service.placeBid('non-existent-id', 'bidder-id', 1000),
            ).rejects.toThrow(NotFoundException);
        });

        it('should reject bid if auction is not active', async () => {
            const { db } = require('../../lib/auth');
            db.transaction.mockImplementation(async (callback) => {
                return callback({
                    select: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    for: jest.fn().mockResolvedValue([
                        {
                            id: 'auction-1',
                            status: 'pending',
                            endTime: new Date(Date.now() + 3600000),
                            sellerId: 'seller-1',
                            currentPrice: '1000',
                            minimumIncrement: '100',
                        },
                    ]),
                });
            });

            await expect(
                service.placeBid('auction-1', 'bidder-1', 1200),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject bid if auction has ended', async () => {
            const { db } = require('../../lib/auth');
            db.transaction.mockImplementation(async (callback) => {
                return callback({
                    select: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    for: jest.fn().mockResolvedValue([
                        {
                            id: 'auction-1',
                            status: 'active',
                            endTime: new Date(Date.now() - 1000), // Ended 1 second ago
                            sellerId: 'seller-1',
                            currentPrice: '1000',
                            minimumIncrement: '100',
                        },
                    ]),
                });
            });

            await expect(
                service.placeBid('auction-1', 'bidder-1', 1200),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject bid from seller on own auction', async () => {
            const { db } = require('../../lib/auth');
            db.transaction.mockImplementation(async (callback) => {
                return callback({
                    select: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    for: jest.fn().mockResolvedValue([
                        {
                            id: 'auction-1',
                            status: 'active',
                            endTime: new Date(Date.now() + 3600000),
                            sellerId: 'seller-1',
                            currentPrice: '1000',
                            minimumIncrement: '100',
                        },
                    ]),
                });
            });

            await expect(
                service.placeBid('auction-1', 'seller-1', 1200),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should reject bid if amount is less than minimum bid', async () => {
            const { db } = require('../../lib/auth');
            db.transaction.mockImplementation(async (callback) => {
                return callback({
                    select: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    for: jest.fn().mockResolvedValue([
                        {
                            id: 'auction-1',
                            status: 'active',
                            endTime: new Date(Date.now() + 3600000),
                            sellerId: 'seller-1',
                            currentPrice: '1000',
                            minimumIncrement: '100',
                        },
                    ]),
                });
            });

            await expect(
                service.placeBid('auction-1', 'bidder-1', 1050), // Less than 1000 + 100
            ).rejects.toThrow(BadRequestException);
        });

        it('should extend auction if bid is placed in last 2 minutes (anti-sniping)', async () => {
            const { db } = require('../../lib/auth');
            const now = new Date();
            const endTime = new Date(now.getTime() + 90000); // 1.5 minutes from now

            let wasExtended = false;
            let newEndTime: Date | null = null;

            db.transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    select: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    for: jest.fn().mockResolvedValue([
                        {
                            id: 'auction-1',
                            status: 'active',
                            endTime: endTime,
                            sellerId: 'seller-1',
                            currentPrice: '1000',
                            minimumIncrement: '100',
                        },
                    ]),
                    insert: jest.fn().mockReturnThis(),
                    values: jest.fn().mockReturnThis(),
                    returning: jest.fn().mockResolvedValue([
                        {
                            id: 'bid-1',
                            auctionId: 'auction-1',
                            bidderId: 'bidder-1',
                            amount: '1200',
                            timestamp: now,
                        },
                    ]),
                    update: jest.fn().mockReturnThis(),
                    set: jest.fn((data) => {
                        if (data.endTime) {
                            wasExtended = true;
                            newEndTime = data.endTime;
                        }
                        return mockTx;
                    }),
                    query: {
                        user: {
                            findFirst: jest.fn().mockResolvedValue({
                                id: 'bidder-1',
                                name: 'John Doe',
                                email: 'john@example.com',
                            }),
                        },
                    },
                };

                return callback(mockTx);
            });

            const result = await service.placeBid('auction-1', 'bidder-1', 1200);

            expect(wasExtended).toBe(true);
            expect(newEndTime).not.toBeNull();
            expect(result.wasExtended).toBe(true);
        });
    });

    describe('getBidHistory', () => {
        it('should return bid history with masked usernames', async () => {
            const { db } = require('../../lib/auth');
            db.query.bid.findMany.mockResolvedValue([
                {
                    id: 'bid-1',
                    amount: '1200',
                    timestamp: new Date(),
                    bidder: {
                        id: 'bidder-1',
                        name: 'John Doe',
                        email: 'john@example.com',
                    },
                },
                {
                    id: 'bid-2',
                    amount: '1100',
                    timestamp: new Date(),
                    bidder: {
                        id: 'bidder-2',
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                    },
                },
            ]);

            const result = await service.getBidHistory('auction-1');

            expect(result).toHaveLength(2);
            expect(result[0].bidder.username).toBe('Jo***e'); // Masked
            expect(result[1].bidder.username).toBe('Ja***h'); // Masked
        });
    });
});

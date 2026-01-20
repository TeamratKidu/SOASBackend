import { db } from '../../lib/auth';
import { user, auction, bid, feedback, account, session, auditLog } from '../schema';
import * as bcrypt from 'bcrypt';

/**
 * Seed script for AxumAuction mock data
 * Creates demo users, auctions, bids, and feedback for demonstration
 */

export async function seedDatabase() {
    console.log('🌱 Seeding AxumAuction database...');

    try {
        console.log('🧹 Clearing existing data...');
        await db.delete(feedback);
        await db.delete(auditLog); // Delete audit logs first as they reference users
        await db.delete(bid);
        await db.delete(auction);
        await db.delete(session);
        await db.delete(account);
        await db.delete(user);

        // Hash password for all demo users
        const demoPassword = await bcrypt.hash('Demo@123', 12);

        // 1. Create Users
        console.log('Creating users...');
        const users = await db
            .insert(user)
            .values([
                // Admin
                {
                    id: crypto.randomUUID(),
                    name: 'Admin User',
                    email: 'admin@axumauction.com',
                    emailVerified: true,
                    role: 'admin',
                    phone: '+251911234567',
                    phoneVerified: true,
                    trustScore: 100,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // Sellers
                {
                    id: crypto.randomUUID(),
                    name: 'Abebe Kebede',
                    email: 'abebe@axumauction.com',
                    emailVerified: true,
                    role: 'seller',
                    phone: '+251922345678',
                    phoneVerified: true,
                    trustScore: 95,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Tigist Haile',
                    email: 'tigist@axumauction.com',
                    emailVerified: true,
                    role: 'seller',
                    phone: '+251933456789',
                    phoneVerified: true,
                    trustScore: 92,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Yohannes Tadesse',
                    email: 'yohannes@axumauction.com',
                    emailVerified: true,
                    role: 'seller',
                    phone: '+251944567890',
                    phoneVerified: true,
                    trustScore: 88,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // Buyers
                {
                    id: crypto.randomUUID(),
                    name: 'Meron Assefa',
                    email: 'meron@axumauction.com',
                    emailVerified: true,
                    role: 'buyer',
                    phone: '+251955678901',
                    phoneVerified: true,
                    trustScore: 85,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Dawit Solomon',
                    email: 'dawit@axumauction.com',
                    emailVerified: true,
                    role: 'buyer',
                    phone: '+251966789012',
                    phoneVerified: true,
                    trustScore: 90,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Sara Tesfaye',
                    email: 'sara@axumauction.com',
                    emailVerified: true,
                    role: 'buyer',
                    phone: '+251977890123',
                    phoneVerified: true,
                    trustScore: 87,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Biniam Gebre',
                    email: 'biniam@axumauction.com',
                    emailVerified: true,
                    role: 'buyer',
                    phone: '+251988901234',
                    phoneVerified: true,
                    trustScore: 82,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Hanna Wolde',
                    email: 'hanna@axumauction.com',
                    emailVerified: true,
                    role: 'buyer',
                    phone: '+251999012345',
                    phoneVerified: true,
                    trustScore: 91,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ])
            .returning();

        console.log(`✅ Created ${users.length} users`);

        // Create corresponding accounts for password login
        await db.insert(account).values(
            users.map((u) => ({
                id: crypto.randomUUID(),
                userId: u.id,
                accountId: u.email,
                providerId: 'credential',
                password: demoPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
        );

        const [admin, seller1, seller2, seller3, buyer1, buyer2, buyer3, buyer4, buyer5] = users;

        // 2. Create Auctions
        console.log('Creating auctions...');
        const now = new Date();
        const auctions = await db
            .insert(auction)
            .values([
                // Active Auctions
                {
                    title: 'Prime Commercial Land - Bole',
                    description:
                        'Premium 500 sqm commercial plot in the heart of Bole, Addis Ababa. Perfect for office building or retail complex. Clear title deed, all utilities available.',
                    startingPrice: '5000000',
                    currentPrice: '5800000',
                    minimumIncrement: '100000',
                    reservePrice: '6500000',
                    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
                    category: 'land',
                    status: 'active',
                    imageUrls: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop'],
                    sellerId: seller1.id,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    title: 'Toyota Land Cruiser V8 2020',
                    description:
                        'Excellent condition Land Cruiser V8, 45,000 km, full service history. Single owner, accident-free. Leather interior, sunroof, navigation system.',
                    startingPrice: '2500000',
                    currentPrice: '3200000',
                    minimumIncrement: '50000',
                    reservePrice: '3500000',
                    endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours
                    category: 'vehicle',
                    status: 'active',
                    imageUrls: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop'],
                    sellerId: seller2.id,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    title: 'Industrial Warehouse - Kaliti',
                    description:
                        '2000 sqm warehouse facility with loading docks, 24/7 security, backup generator. Ideal for logistics or manufacturing.',
                    startingPrice: '8000000',
                    currentPrice: '8500000',
                    minimumIncrement: '200000',
                    reservePrice: '9000000',
                    endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
                    category: 'industrial',
                    status: 'active',
                    imageUrls: ['https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=800&auto=format&fit=crop'],
                    sellerId: seller3.id,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    title: 'Dell Server Rack - Enterprise Grade',
                    description:
                        'Dell PowerEdge R740 server with dual Xeon processors, 128GB RAM, 4TB storage. Perfect for data centers or enterprise applications.',
                    startingPrice: '450000',
                    currentPrice: '520000',
                    minimumIncrement: '10000',
                    reservePrice: '600000',
                    endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
                    category: 'electronics',
                    status: 'active',
                    imageUrls: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop'],
                    sellerId: seller1.id,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    title: 'Office Furniture Set - Complete',
                    description:
                        'Complete office furniture for 20-person workspace. Includes desks, ergonomic chairs, filing cabinets, conference table. Excellent condition.',
                    startingPrice: '180000',
                    currentPrice: '220000',
                    minimumIncrement: '5000',
                    reservePrice: '250000',
                    endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day
                    category: 'furniture',
                    status: 'active',
                    imageUrls: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop'],
                    sellerId: seller2.id,
                    createdAt: now,
                    updatedAt: now,
                },
                // Ended Auctions
                {
                    title: 'Residential Plot - Ayat',
                    description: '300 sqm residential plot in Ayat area. Quiet neighborhood, all amenities nearby.',
                    startingPrice: '1500000',
                    currentPrice: '2100000',
                    minimumIncrement: '50000',
                    reservePrice: '2000000',
                    endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Ended 2 days ago
                    category: 'land',
                    status: 'ended',
                    imageUrls: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'],
                    sellerId: seller3.id,
                    winnerId: buyer1.id,
                    createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                },
                {
                    title: 'Excavator - CAT 320D',
                    description: 'Heavy-duty excavator, 5000 hours, well-maintained. Ideal for construction projects.',
                    startingPrice: '3500000',
                    currentPrice: '4200000',
                    minimumIncrement: '100000',
                    reservePrice: '4000000',
                    endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Ended 5 days ago
                    category: 'machinery',
                    status: 'ended',
                    imageUrls: ['https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop'],
                    sellerId: seller1.id,
                    winnerId: buyer2.id,
                    createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                },
                // 4. Short Duration Auctions for Demo
                {
                    title: '🔥 Live Demo: Ultra-Modern Laptop',
                    description: 'High-performance laptop for testing live bidding and anti-sniping.',
                    startingPrice: '50000.00',
                    currentPrice: '50000.00',
                    minimumIncrement: '1000.00',
                    reservePrice: '60000.00',
                    category: 'electronics',
                    status: 'active',
                    sellerId: seller2.id, // Abebe
                    endTime: new Date(Date.now() + 3 * 60 * 1000), // Ends in 3 minutes
                    imageUrls: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: '🔥 Live Demo: Gold Watch',
                    description: 'Luxury watch ending soon. Test your winning strategy!',
                    startingPrice: '150000.00',
                    currentPrice: '150000.00',
                    minimumIncrement: '5000.00',
                    reservePrice: '200000.00',
                    category: 'fashion',
                    status: 'active',
                    sellerId: seller3.id, // Tigist
                    endTime: new Date(Date.now() + 4 * 60 * 1000), // Ends in 4 minutes
                    imageUrls: ['https://images.unsplash.com/photo-1524592094765-f7a5f23131f1?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: '🔥 Live Demo: Office Desk',
                    description: 'Ergonomic desk. Quick auction.',
                    startingPrice: '12000.00',
                    currentPrice: '12000.00',
                    minimumIncrement: '500.00',
                    reservePrice: '15000.00',
                    category: 'home',
                    status: 'active',
                    sellerId: seller2.id, // Abebe
                    endTime: new Date(Date.now() + 5 * 60 * 1000), // Ends in 5 minutes
                    imageUrls: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: '🔥 Live Demo: Gaming Console',
                    description: 'Latest gen console. Ends very soon!',
                    startingPrice: '35000.00',
                    currentPrice: '35000.00',
                    minimumIncrement: '1000.00',
                    category: 'electronics',
                    status: 'active',
                    sellerId: seller3.id, // Tigist
                    endTime: new Date(Date.now() + 6 * 60 * 1000), // Ends in 6 minutes
                    imageUrls: ['https://images.unsplash.com/photo-1481486916391-e70ea2c502b4?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // 5. Additional Diverse Auctions
                {
                    title: 'iPhone 15 Pro Max - 256GB',
                    description: 'Brand new iPhone 15 Pro Max in Titanium Blue. Sealed box, factory warranty.',
                    startingPrice: '85000.00',
                    currentPrice: '85000.00',
                    minimumIncrement: '2000.00',
                    reservePrice: '95000.00',
                    category: 'electronics',
                    status: 'active',
                    sellerId: seller1.id,
                    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
                    imageUrls: ['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'Canon EOS R5 Camera Body',
                    description: 'Professional mirrorless camera, 45MP, 8K video. Like new condition with original packaging.',
                    startingPrice: '280000.00',
                    currentPrice: '280000.00',
                    minimumIncrement: '10000.00',
                    reservePrice: '320000.00',
                    category: 'electronics',
                    status: 'active',
                    sellerId: seller2.id,
                    endTime: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours
                    imageUrls: ['https://images.unsplash.com/photo-1606980707446-c29c6b5bec1c?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'Luxury Apartment - CMC Area',
                    description: '3-bedroom penthouse with panoramic city views. 180 sqm, modern finishes, parking for 2 cars.',
                    startingPrice: '12000000.00',
                    currentPrice: '12000000.00',
                    minimumIncrement: '300000.00',
                    reservePrice: '14000000.00',
                    category: 'real-estate',
                    status: 'active',
                    sellerId: seller3.id,
                    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    imageUrls: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'Rolex Submariner - Authentic',
                    description: 'Genuine Rolex Submariner with box and papers. Excellent condition, serviced 6 months ago.',
                    startingPrice: '650000.00',
                    currentPrice: '650000.00',
                    minimumIncrement: '25000.00',
                    reservePrice: '750000.00',
                    category: 'luxury',
                    status: 'active',
                    sellerId: seller1.id,
                    endTime: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours
                    imageUrls: ['https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'MacBook Pro M3 Max - 16"',
                    description: '16-inch MacBook Pro with M3 Max chip, 64GB RAM, 2TB SSD. Perfect for creative professionals.',
                    startingPrice: '195000.00',
                    currentPrice: '195000.00',
                    minimumIncrement: '5000.00',
                    reservePrice: '220000.00',
                    category: 'electronics',
                    status: 'active',
                    sellerId: seller2.id,
                    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    imageUrls: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'Designer Leather Sofa Set',
                    description: 'Italian leather 3-piece sofa set. Barely used, modern design, perfect for luxury living room.',
                    startingPrice: '95000.00',
                    currentPrice: '95000.00',
                    minimumIncrement: '3000.00',
                    reservePrice: '110000.00',
                    category: 'furniture',
                    status: 'active',
                    sellerId: seller3.id,
                    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
                    imageUrls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'Electric Scooter - Xiaomi Pro 2',
                    description: 'High-performance electric scooter, 45km range, barely used. Perfect for city commuting.',
                    startingPrice: '18000.00',
                    currentPrice: '18000.00',
                    minimumIncrement: '1000.00',
                    reservePrice: '22000.00',
                    category: 'vehicles',
                    status: 'active',
                    sellerId: seller1.id,
                    endTime: new Date(Date.now() + 15 * 60 * 60 * 1000), // 15 hours
                    imageUrls: ['https://images.unsplash.com/photo-1559311320-f0c155a6e8f8?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    title: 'Vintage Persian Rug - Handmade',
                    description: 'Authentic hand-knotted Persian rug, 3x4 meters. Over 50 years old, excellent condition.',
                    startingPrice: '120000.00',
                    currentPrice: '120000.00',
                    minimumIncrement: '5000.00',
                    reservePrice: '150000.00',
                    category: 'antiques',
                    status: 'active',
                    sellerId: seller2.id,
                    endTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
                    imageUrls: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop'],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ])
            .returning();

        console.log(`✅ Created ${auctions.length} auctions`);

        // 3. Create Bids
        console.log('Creating bids...');
        const bids = await db
            .insert(bid)
            .values([
                // Bids for Land Cruiser (active)
                {
                    auctionId: auctions[1].id,
                    bidderId: buyer1.id,
                    amount: '2600000',
                    timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[1].id,
                    bidderId: buyer2.id,
                    amount: '2800000',
                    timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[1].id,
                    bidderId: buyer3.id,
                    amount: '3000000',
                    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[1].id,
                    bidderId: buyer1.id,
                    amount: '3200000',
                    timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
                },
                // Bids for Bole Land (active)
                {
                    auctionId: auctions[0].id,
                    bidderId: buyer4.id,
                    amount: '5200000',
                    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[0].id,
                    bidderId: buyer5.id,
                    amount: '5500000',
                    timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[0].id,
                    bidderId: buyer4.id,
                    amount: '5800000',
                    timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
                },
                // Bids for Warehouse (active)
                {
                    auctionId: auctions[2].id,
                    bidderId: buyer2.id,
                    amount: '8200000',
                    timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[2].id,
                    bidderId: buyer3.id,
                    amount: '8500000',
                    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                },
                // Bids for Server (active)
                {
                    auctionId: auctions[3].id,
                    bidderId: buyer5.id,
                    amount: '480000',
                    timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[3].id,
                    bidderId: buyer1.id,
                    amount: '520000',
                    timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
                },
                // Bids for Furniture (active)
                {
                    auctionId: auctions[4].id,
                    bidderId: buyer3.id,
                    amount: '200000',
                    timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[4].id,
                    bidderId: buyer4.id,
                    amount: '220000',
                    timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                },
                // Bids for ended auctions
                {
                    auctionId: auctions[5].id,
                    bidderId: buyer2.id,
                    amount: '1800000',
                    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[5].id,
                    bidderId: buyer1.id,
                    amount: '2100000',
                    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[6].id,
                    bidderId: buyer3.id,
                    amount: '3800000',
                    timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[6].id,
                    bidderId: buyer2.id,
                    amount: '4200000',
                    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                },
            ])
            .returning();

        console.log(`✅ Created ${bids.length} bids`);

        // 4. Create Feedback
        console.log('Creating feedback...');
        const feedbacks = await db
            .insert(feedback)
            .values([
                {
                    auctionId: auctions[5].id,
                    fromUserId: buyer1.id,
                    toUserId: seller3.id,
                    rating: 5,
                    comment: 'Excellent seller! Very professional and transparent. Highly recommended.',
                    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[6].id,
                    fromUserId: buyer2.id,
                    toUserId: seller1.id,
                    rating: 4,
                    comment: 'Good experience overall. Equipment was as described. Smooth transaction.',
                    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[5].id,
                    fromUserId: seller3.id,
                    toUserId: buyer1.id,
                    rating: 5,
                    comment: 'Great buyer! Payment was prompt. Would do business again.',
                    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                },
                {
                    auctionId: auctions[6].id,
                    fromUserId: seller1.id,
                    toUserId: buyer2.id,
                    rating: 5,
                    comment: 'Professional buyer. Quick payment and smooth handover.',
                    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
                },
            ])
            .returning();

        console.log(`✅ Created ${feedbacks.length} feedback entries`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Demo Credentials:');
        console.log('Admin: admin@axumauction.com / Demo@123');
        console.log('Seller: abebe@axumauction.com / Demo@123');
        console.log('Buyer: meron@axumauction.com / Demo@123');
        console.log('\nAll users have password: Demo@123');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('✅ Seed completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seed failed:', error);
            process.exit(1);
        });
}

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5433,
    user: process.env.DATABASE_USER || 'soas_user',
    password: process.env.DATABASE_PASSWORD || 'soas_password',
    database: process.env.DATABASE_NAME || 'soas_db',
});

async function seedDatabase() {
    console.log('🌱 Starting SOAS database seeding...\n');

    try {
        // Check for existing users
        const users = await pool.query('SELECT id, email, role FROM "user" ORDER BY "createdAt" DESC LIMIT 10');

        if (users.rows.length === 0) {
            console.log('❌ No users found!');
            console.log('\n📋 Setup Instructions:');
            console.log('1. Start backend: cd backend && npm run start:dev');
            console.log('2. Go to: http://localhost:5173/signup');
            console.log('3. Create these accounts:');
            console.log('   - admin@axumauction.et');
            console.log('   - seller1@axumauction.et');
            console.log('   - buyer1@axumauction.et');
            console.log('4. Run SQL: UPDATE "user" SET role = \'admin\' WHERE email = \'admin@axumauction.et\';');
            console.log('5. Run SQL: UPDATE "user" SET role = \'seller\' WHERE email = \'seller1@axumauction.et\';');
            console.log('6. Run this script again\n');
            await pool.end();
            process.exit(0);
        }

        console.log(`✅ Found ${users.rows.length} existing users\n`);

        const sellers = users.rows.filter(u => u.role === 'seller');
        const buyers = users.rows.filter(u => u.role === 'buyer');

        const sellerId = sellers[0]?.id || users.rows[0]?.id;
        const seller2Id = sellers[1]?.id || users.rows[1]?.id || sellerId;
        const buyerId = buyers[0]?.id || users.rows[1]?.id || users.rows[0]?.id;

        console.log('🏛️  Creating 10 mock auctions...\n');

        const now = new Date();

        const auctions = [
            ['Toyota Land Cruiser V8 - 2020', 'Excellent condition, 45,000 km', 'Vehicles', 2500000, 3200000, 50000, 3000000, 2, sellerId, ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800']],
            ['Mercedes-Benz E-Class 2019', 'Former diplomatic vehicle', 'Vehicles', 1800000, 2100000, 50000, 2000000, 5, seller2Id, ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800']],
            ['Commercial Land - Bole (50yr)', '2,500 sqm prime location', 'Land Leases', 25000000, 28500000, 500000, 27000000, 6, sellerId, ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800']],
            ['Agricultural Land - Debre Zeit', '50 hectares fertile land', 'Land Leases', 15000000, 17200000, 200000, 16000000, 10, seller2Id, ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800']],
            ['NGO Office Furniture Set', 'Complete office liquidation', 'NGO Assets', 450000, 520000, 10000, 500000, 5, sellerId, ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800']],
            ['Dell Server Rack & IT Equipment', 'Enterprise-grade servers', 'NGO Assets', 850000, 950000, 25000, 900000, 7, seller2Id, ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800']],
            ['Court Seized - Luxury Villa Bole', '4-bedroom villa, foreclosure', 'Court Assets', 18000000, 21500000, 250000, 20000000, 4, sellerId, ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800']],
            ['Seized BMW X5 2021', 'Court-seized luxury SUV', 'Court Assets', 2200000, 2650000, 50000, 2500000, 3, seller2Id, ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800']],
            ['Charity - Ethiopian Art', 'Original painting, charity auction', 'Charity Artworks', 500000, 720000, 20000, 650000, 6, sellerId, ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800']],
            ['Charity - Orthodox Cross 18th C', 'Rare antique cross', 'Charity Artworks', 350000, 425000, 15000, 400000, 4, seller2Id, ['https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800']],
        ];

        for (const [title, desc, cat, start, curr, inc, reserve, hours, seller, imgs] of auctions) {
            const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
            await pool.query(`
                INSERT INTO auctions (
                    title, description, category, 
                    starting_price, current_price, minimum_increment, reserve_price,
                    end_time, status, seller_id, "imageUrls", 
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            `, [title, desc, cat, start, curr, inc, reserve, endTime, 'active', seller, imgs]);

            console.log(`  ✅ ${cat}: ${title}`);
        }

        console.log('\n✅ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`  - ${users.rows.length} existing users`);
        console.log(`  - 10 auctions created`);
        console.log('\n🎯 Ready for defense demonstration!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Seed failed:', err);
        process.exit(1);
    });

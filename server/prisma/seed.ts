import { PrismaClient, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPwd(password: string) {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

// All names are 20-60 characters as per validation rules
const DEMO_PASSWORD = 'Admin@1234';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.rating.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const hash = await hashPwd(DEMO_PASSWORD);

  // 1. System Administrator
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator Account',
      email: 'admin@storerating.com',
      passwordHash: hash,
      address: '100 Admin Tower, Silicon Valley, CA 94025',
      role: 'ADMIN',
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // 2. Store Owners (4 total: 3 with stores, 1 without)
  const ownerData = [
    { name: 'Marcus Wellington Owner', email: 'marcus.owner@example.com', address: '45 Owner Street, Downtown Portland, OR 97201' },
    { name: 'Priya Sharma Store Owner', email: 'priya.owner@example.com', address: '88 Merchant Road, Austin, TX 78701' },
    { name: 'Chen Wei Business Manager', email: 'chen.owner@example.com', address: '12 Commerce Blvd, San Francisco, CA 94102' },
    { name: 'Olivia Nakamura Partner', email: 'olivia.owner@example.com', address: '67 Enterprise Way, Seattle, WA 98101' },
  ];

  const owners = [];
  for (const o of ownerData) {
    const owner = await prisma.user.create({
      data: { ...o, passwordHash: hash, role: 'OWNER' },
    });
    owners.push(owner);
  }
  console.log(`  ✓ ${owners.length} store owners created`);

  // 3. Stores (15 stores, 3 assigned to owners)
  const storeData = [
    { name: 'The Daily Grind Coffeehouse', email: 'hello@dailygrind.com', address: '123 Brew Lane, Portland, OR 97201', ownerId: owners[0].id },
    { name: 'Sharma Electronics Center', email: 'info@sharmaelec.com', address: '456 Tech Park Drive, Austin, TX 78701', ownerId: owners[1].id },
    { name: 'Golden Dragon Restaurant', email: 'eat@goldendragon.com', address: '789 Chinatown Square, San Francisco, CA 94102', ownerId: owners[2].id },
    { name: 'Sunrise Organic Grocery Store', email: 'shop@sunriseorganic.com', address: '321 Fresh Market Ave, Denver, CO 80202' },
    { name: 'Metro Fitness and Wellness', email: 'join@metrofitness.com', address: '555 Workout Blvd, Chicago, IL 60601' },
    { name: 'Bluestone Books and Cafe', email: 'read@bluestonebooks.com', address: '222 Literary Lane, Boston, MA 02101' },
    { name: 'Pacific Coast Surf Supplies', email: 'waves@pacificsurf.com', address: '101 Beach Front Road, San Diego, CA 92101' },
    { name: 'Mountain Peak Outdoor Gear', email: 'hike@mountainpeak.com', address: '444 Trail Ridge Drive, Boulder, CO 80301' },
    { name: 'Heritage Antiques Gallery', email: 'find@heritageantiq.com', address: '876 Vintage Row, Nashville, TN 37201' },
    { name: 'Pixel Perfect Design Studio', email: 'create@pixelperfect.com', address: '999 Creative Way, Brooklyn, NY 11201' },
    { name: 'Green Thumb Garden Center', email: 'grow@greenthumb.com', address: '150 Nursery Road, Sacramento, CA 95814' },
    { name: 'Velocity Auto Repair Shop', email: 'fix@velocityauto.com', address: '700 Motor Blvd, Detroit, MI 48201' },
    { name: 'Sweet Harmony Bakery Shop', email: 'bake@sweetharmony.com', address: '300 Pastry Circle, Philadelphia, PA 19101' },
    { name: 'TechBridge Computer Services', email: 'help@techbridge.com', address: '650 Silicon Avenue, San Jose, CA 95110' },
    { name: 'Coastal Pet Care Veterinary', email: 'care@coastalpetvet.com', address: '425 Animal Lane, Miami, FL 33101' },
  ];

  const stores = [];
  for (const s of storeData) {
    const store = await prisma.store.create({ data: s });
    stores.push(store);
  }
  console.log(`  ✓ ${stores.length} stores created`);

  // 4. Normal Users (~25)
  const userNames = [
    'Alexander Benjamin Cooper',
    'Samantha Michelle Rodriguez',
    'Jonathan Michael Richardson',
    'Isabella Christine Martinez',
    'Christopher Daniel Thompson',
    'Victoria Elizabeth Anderson',
    'Benjamin Thomas Henderson',
    'Katherine Marie Fitzgerald',
    'Nathaniel James Patterson',
    'Alexandra Nicole Washington',
    'Sebastian Arthur Morrison',
    'Gabriella Rose Montgomery',
    'Maximilian Jack Robertson',
    'Charlotte Anna Stevenson',
    'Dominic Rafael Hernandez',
    'Penelope Grace Williamson',
    'Theodore Charles Henderson',
    'Anastasia Irene Petrov',
    'Jeremiah Lucas Patterson',
    'Madeleine Claire O\'Brien',
    'Frederick Robert Castillo',
    'Evangeline Kate Thompson',
    'Montgomery Alan Whitfield',
    'Josephine Marie Dubois',
    'Archibald James Thornton',
  ];

  const normalUsers = [];
  for (let i = 0; i < userNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        name: userNames[i],
        email: `user${i + 1}@example.com`,
        passwordHash: hash,
        address: `${100 + i * 10} Main Street, Apt ${i + 1}, Anytown, US ${10000 + i}`,
        role: 'USER',
      },
    });
    normalUsers.push(user);
  }
  console.log(`  ✓ ${normalUsers.length} normal users created`);

  // 5. Ratings (spread unevenly, ~20000 target but we'll do a representative set)
  console.log('  ⏳ Creating ratings...');
  let ratingCount = 0;

  for (const user of normalUsers) {
    // Each user rates a random subset of stores
    const numToRate = Math.floor(Math.random() * stores.length) + 3; // 3 to all stores
    const shuffled = [...stores].sort(() => Math.random() - 0.5);
    const toRate = shuffled.slice(0, numToRate);

    for (const store of toRate) {
      // Weighted random: more 3s and 4s, fewer 1s and 5s
      const weights = [0.05, 0.15, 0.30, 0.35, 0.15]; // 1,2,3,4,5
      const rand = Math.random();
      let cumulative = 0;
      let rating = 3;
      for (let r = 0; r < weights.length; r++) {
        cumulative += weights[r];
        if (rand <= cumulative) {
          rating = r + 1;
          break;
        }
      }

      await prisma.rating.create({
        data: {
          userId: user.id,
          storeId: store.id,
          rating,
        },
      });
      ratingCount++;
    }
  }

  console.log(`  ✓ ${ratingCount} ratings created`);

  console.log('\n📋 Demo Credentials (all use the same password):');
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   Admin:    admin@storerating.com`);
  console.log(`   Owner:    marcus.owner@example.com`);
  console.log(`   User:     user1@example.com`);
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

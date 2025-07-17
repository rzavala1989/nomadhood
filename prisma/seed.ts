import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample neighborhoods
  const neighborhoods = await Promise.all([
    prisma.neighborhood.upsert({
      where: { id: 'sample-neighborhood-1' },
      update: {},
      create: {
        id: 'sample-neighborhood-1',
        name: 'Greenwich Village',
        city: 'New York',
        state: 'NY',
        zip: '10014',
        description: 'Historic neighborhood known for its bohemian culture, tree-lined streets, and vibrant nightlife. Home to Washington Square Park and numerous cafes, restaurants, and boutiques.',
        latitude: 40.7335,
        longitude: -74.0027,
      },
    }),
    prisma.neighborhood.upsert({
      where: { id: 'sample-neighborhood-2' },
      update: {},
      create: {
        id: 'sample-neighborhood-2',
        name: 'Mission District',
        city: 'San Francisco',
        state: 'CA',
        zip: '94110',
        description: 'Vibrant Latino neighborhood famous for its street art, authentic taquerias, and lively nightlife. Known for colorful murals and diverse community.',
        latitude: 37.7599,
        longitude: -122.4148,
      },
    }),
    prisma.neighborhood.upsert({
      where: { id: 'sample-neighborhood-3' },
      update: {},
      create: {
        id: 'sample-neighborhood-3',
        name: 'Capitol Hill',
        city: 'Seattle',
        state: 'WA',
        zip: '98102',
        description: 'Hip neighborhood with a thriving arts scene, independent shops, and diverse dining options. Known for its LGBTQ+ friendly community and nightlife.',
        latitude: 47.6205,
        longitude: -122.3212,
      },
    }),
    prisma.neighborhood.upsert({
      where: { id: 'sample-neighborhood-4' },
      update: {},
      create: {
        id: 'sample-neighborhood-4',
        name: 'Wicker Park',
        city: 'Chicago',
        state: 'IL',
        zip: '60622',
        description: 'Trendy neighborhood known for its vintage shops, craft breweries, and live music venues. Popular among young professionals and artists.',
        latitude: 41.9073,
        longitude: -87.6776,
      },
    }),
    prisma.neighborhood.upsert({
      where: { id: 'sample-neighborhood-5' },
      update: {},
      create: {
        id: 'sample-neighborhood-5',
        name: 'South Beach',
        city: 'Miami',
        state: 'FL',
        zip: '33139',
        description: 'Iconic beachfront neighborhood famous for Art Deco architecture, white sand beaches, and vibrant nightlife. A popular destination for tourists and locals alike.',
        latitude: 25.7907,
        longitude: -80.1300,
      },
    }),
  ]);

  console.log(`✅ Created ${neighborhoods.length} sample neighborhoods`);

  // Create a sample admin user (if not exists)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nomadhood.com' },
    update: {},
    create: {
      email: 'admin@nomadhood.com',
      name: 'Admin User',
      isAdmin: true,
    },
  });

  console.log('✅ Created admin user');

  // Create sample reviews
  const sampleReviews = [
    {
      neighborhoodId: 'sample-neighborhood-1',
      rating: 5,
      comment: 'Love the historic charm and walkability of Greenwich Village. Great restaurants and the park is beautiful!',
    },
    {
      neighborhoodId: 'sample-neighborhood-1',
      rating: 4,
      comment: 'Amazing neighborhood with so much character. Can be a bit pricey but worth it for the location.',
    },
    {
      neighborhoodId: 'sample-neighborhood-2',
      rating: 5,
      comment: 'The Mission has the best food scene in SF! Love the street art and community vibe.',
    },
    {
      neighborhoodId: 'sample-neighborhood-3',
      rating: 4,
      comment: 'Great nightlife and very walkable. Perfect for young professionals.',
    },
    {
      neighborhoodId: 'sample-neighborhood-4',
      rating: 4,
      comment: 'Love the indie music scene and vintage shopping. Great neighborhood for creatives.',
    },
  ];

  for (const reviewData of sampleReviews) {
    await prisma.review.upsert({
      where: {
        userId_neighborhoodId: {
          userId: adminUser.id,
          neighborhoodId: reviewData.neighborhoodId,
        },
      },
      update: {},
      create: {
        ...reviewData,
        userId: adminUser.id,
      },
    });
  }

  console.log(`✅ Created ${sampleReviews.length} sample reviews`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

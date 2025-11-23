
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying StationSettings...');

    // 1. Upsert settings (create if not exists)
    console.log('Upserting settings...');
    const settings = await prisma.stationSettings.upsert({
        where: { id: 'station' },
        update: {
            name: 'Test Station',
            description: 'Test Description',
            email: 'test@example.com'
        },
        create: {
            id: 'station',
            timezone: 'UTC',
            name: 'Test Station',
            description: 'Test Description',
            email: 'test@example.com'
        }
    });
    console.log('Settings upserted:', settings);

    // 2. Read back
    console.log('Reading settings...');
    const readSettings = await prisma.stationSettings.findUnique({
        where: { id: 'station' }
    });
    console.log('Read settings:', readSettings);

    if (readSettings.name === 'Test Station') {
        console.log('✅ Verification SUCCESS');
    } else {
        console.error('❌ Verification FAILED: Name mismatch');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

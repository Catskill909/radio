import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const shows = await prisma.show.findMany();
    console.log(JSON.stringify(shows, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

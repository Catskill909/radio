import { prisma } from "./lib/prisma";

async function main() {
    const recordings = await prisma.recording.findMany();
    console.log("Recordings found:", recordings.length);
    recordings.forEach(r => {
        console.log(`${r.id}: ${r.status} (Started: ${r.startTime})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

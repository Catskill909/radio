import { prisma } from "./lib/prisma";

async function main() {
    console.log("Creating test show and slot...");

    // 1. Create a test show
    const show = await prisma.show.create({
        data: {
            title: "Automated Test Show",
            description: "A show created to test the recorder service.",
            type: "Test",
            recordingEnabled: true,
            recordingSource: "https://supersoul.site:8040/frac", // Real stream URL
        },
    });

    console.log(`Created show: ${show.title} (${show.id})`);

    // 2. Schedule it to start in 1 minute
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 minutes duration

    const slot = await prisma.scheduleSlot.create({
        data: {
            showId: show.id,
            startTime: startTime,
            endTime: endTime,
            isRecurring: false,
        },
    });

    console.log(`Scheduled slot: ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`);
    console.log("Wait for the recorder service to pick it up!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

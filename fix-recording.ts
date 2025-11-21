import { prisma } from "./lib/prisma";

async function main() {
    const stuckRecordingId = "9be3e432-516d-441f-a6b7-2e4fc3b7e24d";

    console.log(`Fixing recording ${stuckRecordingId}...`);

    await prisma.recording.update({
        where: { id: stuckRecordingId },
        data: {
            status: "COMPLETED",
            endTime: new Date() // Set end time to now
        }
    });

    console.log("Recording marked as COMPLETED.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

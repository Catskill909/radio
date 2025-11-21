import { prisma } from "./lib/prisma";

async function main() {
    console.log("Finding overlapping schedule slots...");

    // Get all schedule slots
    const allSlots = await prisma.scheduleSlot.findMany({
        include: {
            show: true,
        },
        orderBy: {
            startTime: 'asc',
        },
    });

    const overlaps: Array<{ slot1: any; slot2: any }> = [];

    // Check each pair of slots for overlap
    for (let i = 0; i < allSlots.length; i++) {
        for (let j = i + 1; j < allSlots.length; j++) {
            const slot1 = allSlots[i];
            const slot2 = allSlots[j];

            // Check if they overlap
            const overlap =
                (slot1.startTime <= slot2.startTime && slot1.endTime > slot2.startTime) ||
                (slot1.startTime < slot2.endTime && slot1.endTime >= slot2.endTime) ||
                (slot1.startTime >= slot2.startTime && slot1.endTime <= slot2.endTime);

            if (overlap) {
                overlaps.push({ slot1, slot2 });
            }
        }
    }

    if (overlaps.length === 0) {
        console.log("✅ No overlapping slots found!");
        return;
    }

    console.log(`\n❌ Found ${overlaps.length} overlapping slot pairs:\n`);

    overlaps.forEach((overlap, index) => {
        console.log(`${index + 1}. "${overlap.slot1.show.title}" (${overlap.slot1.id})`);
        console.log(`   ${overlap.slot1.startTime.toLocaleString()} - ${overlap.slot1.endTime.toLocaleString()}`);
        console.log(`   OVERLAPS WITH`);
        console.log(`   "${overlap.slot2.show.title}" (${overlap.slot2.id})`);
        console.log(`   ${overlap.slot2.startTime.toLocaleString()} - ${overlap.slot2.endTime.toLocaleString()}\n`);
    });

    console.log("\n🔧 To fix overlaps, you can:");
    console.log("1. Delete one of the overlapping slots via Prisma Studio");
    console.log("2. Edit the slot times to not overlap");
    console.log("\nTo delete a specific slot, run:");
    console.log("npx prisma studio");
    console.log("Then navigate to ScheduleSlot and delete the unwanted slots.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

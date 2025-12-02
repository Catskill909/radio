"use server";

import { PrismaClient } from "@prisma/client";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function importData(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Load ZIP
        const zip = await JSZip.loadAsync(buffer);

        // 2. Read data.json
        const dataFile = zip.file("data.json");
        if (!dataFile) {
            throw new Error("Invalid archive: data.json missing");
        }
        const dataJson = await dataFile.async("string");
        const data = JSON.parse(dataJson);

        if (!data.shows || !Array.isArray(data.shows)) {
            throw new Error("Invalid data format");
        }

        // 3. Prepare Directories
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // 4. Restore Images FIRST (outside transaction to avoid timeout)
        console.log("Restoring images...");
        const imagePromises: Promise<void>[] = [];

        // Iterate through all files in the ZIP looking for images
        zip.forEach((relativePath, file) => {
            // Only process files in the images/ directory
            if (relativePath.startsWith("images/") && !file.dir) {
                const filename = path.basename(relativePath);
                const destPath = path.join(uploadsDir, filename);

                const promise = file.async("nodebuffer").then((content) => {
                    fs.writeFileSync(destPath, content);
                    console.log(`Restored image: ${filename}`);
                }).catch(err => {
                    console.error(`Failed to restore image ${filename}:`, err);
                });

                imagePromises.push(promise);
            }
        });

        // Wait for all images to be restored
        await Promise.all(imagePromises);
        console.log(`Restored ${imagePromises.length} images`);

        // 5. Transaction: Wipe & Restore Database
        console.log("Starting database transaction...");
        await prisma.$transaction(async (tx) => {
            // A. Wipe Data
            console.log("Deleting existing data...");
            // Delete slots first due to foreign key constraints (Cascade should handle it, but being explicit is safer)
            await tx.scheduleSlot.deleteMany({});
            await tx.show.deleteMany({});

            // B. Restore Shows & Slots
            console.log(`Restoring ${data.shows.length} shows...`);
            for (const show of data.shows) {
                const { slots, ...showData } = show;

                // Create Show
                await tx.show.create({
                    data: {
                        ...showData,
                        createdAt: new Date(showData.createdAt),
                        updatedAt: new Date(showData.updatedAt),
                        // Ensure recordingSource is null (double safety)
                        recordingSource: null,
                    },
                });

                // Create Slots
                if (slots && slots.length > 0) {
                    await tx.scheduleSlot.createMany({
                        data: slots.map((slot: any) => ({
                            ...slot,
                            startTime: new Date(slot.startTime),
                            endTime: new Date(slot.endTime),
                        })),
                    });
                }
            }
            console.log("Database transaction completed");
        }, {
            timeout: 60000, // 60 second timeout for large imports
        });

        // 6. Restore Settings (if present)
        if (data.settings) {
            console.log("Restoring station settings...");
            const settingsPath = path.join(process.cwd(), 'station-settings.json');
            try {
                fs.writeFileSync(settingsPath, JSON.stringify(data.settings, null, 2));
                console.log("Station settings restored.");
            } catch (e) {
                console.error("Failed to restore station settings:", e);
            }
        }

        revalidatePath("/");
        revalidatePath("/schedule");
        revalidatePath("/shows");
        revalidatePath("/admin");
        return { success: true, message: `Imported ${data.shows.length} shows successfully.` };

    } catch (error) {
        console.error("Import failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

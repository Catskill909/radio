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

        // 4. Transaction: Wipe & Restore
        // We do DB operations in a transaction to ensure integrity
        await prisma.$transaction(async (tx) => {
            // A. Wipe Data
            // Delete slots first due to foreign key constraints (Cascade should handle it, but being explicit is safer)
            await tx.scheduleSlot.deleteMany({});
            await tx.show.deleteMany({});

            // B. Restore Images
            const imagesFolder = zip.folder("images");
            if (imagesFolder) {
                const imageFiles = Object.keys(imagesFolder.files);
                for (const filename of imageFiles) {
                    // Skip directories
                    if (imagesFolder.files[filename].dir) continue;

                    // Only process files in the images/ root (ignore nested if any)
                    const cleanFilename = path.basename(filename);

                    const content = await imagesFolder.file(filename)?.async("nodebuffer");
                    if (content) {
                        const destPath = path.join(uploadsDir, cleanFilename);
                        fs.writeFileSync(destPath, content);
                    }
                }
            }

            // C. Restore Shows & Slots
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
        });

        revalidatePath("/");
        return { success: true, message: `Imported ${data.shows.length} shows successfully.` };

    } catch (error) {
        console.error("Import failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

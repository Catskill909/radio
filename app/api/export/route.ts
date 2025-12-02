import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Fetch Data
        const shows = await prisma.show.findMany({
            include: {
                slots: true,
            },
        });

        // 2. Sanitize Data
        const sanitizedShows = shows.map((show) => ({
            ...show,
            recordingSource: null, // Clear site-specific config
            // Ensure we don't export internal IDs if we want to regenerate them? 
            // For "Replace All", keeping IDs is actually better to maintain relationships if we were merging.
            // But since we are wiping, keeping IDs ensures the slots link back correctly in the JSON.
        }));

        // Read settings file
        const settingsPath = path.join(process.cwd(), 'station-settings.json');
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            try {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            } catch (e) {
                console.error("Failed to read settings for export:", e);
            }
        }

        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            settings: settings,
            shows: sanitizedShows,
        };

        // 3. Create ZIP
        const zip = new JSZip();
        zip.file("data.json", JSON.stringify(exportData, null, 2));

        const imagesFolder = zip.folder("images");
        const uploadsDir = path.join(process.cwd(), "uploads");

        // 4. Add Images
        for (const show of sanitizedShows) {
            if (show.image) {
                // Expecting format "/uploads/filename.png"
                const filename = show.image.replace("/uploads/", "");
                const filePath = path.join(uploadsDir, filename);

                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath);
                    imagesFolder?.file(filename, fileData);
                } else {
                    console.warn(`Export warning: Image not found for show ${show.title}: ${filePath}`);
                }
            }
        }

        // 5. Generate ZIP Stream
        const zipContent = await zip.generateAsync({ type: "nodebuffer" });

        // 6. Return Download
        const filename = `radio-suite-export-${new Date().toISOString().split('T')[0]}.zip`;

        return new NextResponse(zipContent as any, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error("Export failed:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { trimAudio, backupAudioFile, getAudioDuration } from "@/lib/ffmpeg";
import { unlink } from "fs/promises";

export async function POST(request: NextRequest) {
    try {
        const { filename, startTime, endTime } = await request.json();

        // Validation
        if (!filename || typeof startTime !== 'number' || typeof endTime !== 'number') {
            return NextResponse.json(
                { success: false, error: "filename, startTime, and endTime are required" },
                { status: 400 }
            );
        }

        if (startTime < 0 || endTime <= startTime) {
            return NextResponse.json(
                { success: false, error: "Invalid time range" },
                { status: 400 }
            );
        }

        // Security check: prevent directory traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json(
                { success: false, error: "Invalid filename" },
                { status: 400 }
            );
        }

        const recordingsDir = path.join(process.cwd(), "recordings");
        const filepath = path.join(recordingsDir, filename);

        // Create backup before modifying the original
        console.log(`Creating backup of ${filename}...`);
        const backupPath = await backupAudioFile(filepath);

        // Create a temporary file for the trimmed audio
        const tempPath = path.join(recordingsDir, `temp_${Date.now()}_${filename}`);

        try {
            // Trim the audio
            console.log(`Trimming ${filename} from ${startTime}s to ${endTime}s...`);
            await trimAudio(filepath, tempPath, startTime, endTime);

            // Delete the original file
            await unlink(filepath);

            // Rename temp file to original filename
            const fs = await import('fs/promises');
            await fs.rename(tempPath, filepath);

            // Get the new duration
            const newDuration = await getAudioDuration(filepath);

            console.log(`Successfully trimmed ${filename}. New duration: ${newDuration}s`);

            return NextResponse.json({
                success: true,
                filename: filename,
                duration: newDuration,
                backupPath: path.basename(backupPath)
            });
        } catch (error) {
            // If trimming failed, restore from backup
            console.error("Trimming failed, restoring from backup...");
            try {
                const fs = await import('fs/promises');
                await fs.copyFile(backupPath, filepath);
            } catch (restoreError) {
                console.error("Failed to restore backup:", restoreError);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error trimming audio file:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { trimAudio, deleteSection, backupAudioFile, getAudioDuration } from "@/lib/ffmpeg";
import { unlink } from "fs/promises";

export async function POST(request: NextRequest) {
    try {
        const { filename, startTime, endTime, mode = 'keep' } = await request.json();

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

        if (!['keep', 'delete'].includes(mode)) {
            return NextResponse.json(
                { success: false, error: "mode must be 'keep' or 'delete'" },
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

        // Create a temporary file for the processed audio
        const tempPath = path.join(recordingsDir, `temp_${Date.now()}_${filename}`);

        try {
            if (mode === 'keep') {
                // Keep selection: trim to keep only the selected portion
                console.log(`Keeping selection of ${filename} from ${startTime}s to ${endTime}s...`);
                await trimAudio(filepath, tempPath, startTime, endTime);
            } else {
                // Delete selection: remove the selected portion, keep the rest
                console.log(`Deleting selection of ${filename} from ${startTime}s to ${endTime}s...`);
                await deleteSection(filepath, tempPath, startTime, endTime);
            }

            // Delete the original file
            await unlink(filepath);

            // Rename temp file to original filename
            const fs = await import('fs/promises');
            await fs.rename(tempPath, filepath);

            // Get the new duration
            const newDuration = await getAudioDuration(filepath);

            console.log(`Successfully processed ${filename}. Mode: ${mode}. New duration: ${newDuration}s`);

            return NextResponse.json({
                success: true,
                filename: filename,
                duration: newDuration,
                mode: mode,
                backupPath: path.basename(backupPath)
            });
        } catch (error) {
            // If processing failed, restore from backup
            console.error("Processing failed, restoring from backup...");
            try {
                const fs = await import('fs/promises');
                await fs.copyFile(backupPath, filepath);
                // Clean up temp file if it exists
                try {
                    await unlink(tempPath);
                } catch (e) { /* ignore */ }
            } catch (restoreError) {
                console.error("Failed to restore backup:", restoreError);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error processing audio file:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}

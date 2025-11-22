import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { applyFade, normalizeAudio, backupAudioFile, getAudioDuration } from "@/lib/ffmpeg";
import { unlink } from "fs/promises";

export async function POST(request: NextRequest) {
    console.log("Received request to /api/process-audio");
    try {
        const body = await request.json();
        console.log("Request body:", body);
        const { filename, operation, parameters } = body;

        // Validation
        if (!filename || !operation) {
            console.error("Missing filename or operation");
            return NextResponse.json(
                { success: false, error: "filename and operation are required" },
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
            // Process based on operation type
            switch (operation) {
                case 'fade':
                    const fadeIn = parameters?.fadeIn || 0;
                    const fadeOut = parameters?.fadeOut || 0;
                    console.log(`Applying fade to ${filename}: in=${fadeIn}s, out=${fadeOut}s`);
                    await applyFade(filepath, tempPath, fadeIn, fadeOut);
                    break;

                case 'normalize':
                    const targetLUFS = parameters?.targetLUFS || -16;
                    console.log(`Normalizing ${filename} to ${targetLUFS} LUFS`);
                    await normalizeAudio(filepath, tempPath, targetLUFS);
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Delete the original file
            await unlink(filepath);

            // Rename temp file to original filename
            const fs = await import('fs/promises');
            await fs.rename(tempPath, filepath);

            // Get the new duration
            const newDuration = await getAudioDuration(filepath);

            console.log(`Successfully processed ${filename}. New duration: ${newDuration}s`);

            return NextResponse.json({
                success: true,
                filename: filename,
                duration: newDuration,
                backupPath: path.basename(backupPath),
                operation: operation
            });
        } catch (error) {
            // If processing failed, restore from backup
            console.error("Processing failed, restoring from backup...");
            try {
                const fs = await import('fs/promises');
                await fs.copyFile(backupPath, filepath);
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

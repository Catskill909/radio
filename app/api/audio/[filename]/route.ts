import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const filename = (await params).filename;

    // Security check: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "recordings", filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse("File not found", { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Get range header
    const range = request.headers.get("range");

    if (range) {
        // Parse range header (e.g., "bytes=0-1023")
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        // Read only the requested chunk
        const file = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(chunkSize);
        fs.readSync(file, buffer, 0, chunkSize, start);
        fs.closeSync(file);

        // Return 206 Partial Content
        return new NextResponse(buffer, {
            status: 206,
            headers: {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize.toString(),
                "Content-Type": "audio/mpeg",
            },
        });
    } else {
        // No range requested, send full file
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": fileSize.toString(),
                "Accept-Ranges": "bytes",
                "Content-Disposition": `inline; filename="${filename}"`,
            },
        });
    }
}

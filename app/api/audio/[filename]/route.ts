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

    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": stats.size.toString(),
            "Content-Disposition": `inline; filename="${filename}"`,
        },
    });
}

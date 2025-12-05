import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List all streams
export async function GET() {
    try {
        const streams = await prisma.icecastStream.findMany({
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(streams)
    } catch (error: any) {
        console.error('Failed to fetch streams:', error)
        return NextResponse.json(
            { error: 'Failed to fetch streams' },
            { status: 500 }
        )
    }
}

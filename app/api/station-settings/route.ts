import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const settings = await prisma.stationSettings.findFirst()
        return NextResponse.json(settings || { timezone: 'UTC' })
    } catch (error) {
        console.error('Failed to fetch station settings:', error)
        return NextResponse.json({ timezone: 'UTC' })
    }
}

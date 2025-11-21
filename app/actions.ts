'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createShow(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const host = formData.get("host") as string;
    const image = formData.get("image") as string;
    const recordingEnabled = formData.get("recordingEnabled") === "true";
    const recordingSource = formData.get("recordingSource") as string;

    const startDateStr = formData.get("startDate") as string;
    const startTimeStr = formData.get("startTime") as string;
    const durationMins = parseInt(formData.get("duration") as string);
    const isRecurring = formData.get("isRecurring") === "true";

    const show = await prisma.show.create({
        data: {
            title,
            description,
            type,
            host,
            image,
            recordingEnabled,
            recordingSource,
        },
    });

    // Calculate initial start and end time
    const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

    // Generate slots
    const slotsToCreate = [];

    if (isRecurring) {
        // Generate slots for the next 12 weeks (approx 3 months)
        for (let i = 0; i < 12; i++) {
            const slotStart = new Date(startDateTime);
            slotStart.setDate(slotStart.getDate() + (i * 7));

            const slotEnd = new Date(endDateTime);
            slotEnd.setDate(slotEnd.getDate() + (i * 7));

            slotsToCreate.push({
                showId: show.id,
                startTime: slotStart,
                endTime: slotEnd,
                isRecurring: true,
            });
        }
    } else {
        // Single slot
        slotsToCreate.push({
            showId: show.id,
            startTime: startDateTime,
            endTime: endDateTime,
            isRecurring: false,
        });
    }

    await prisma.scheduleSlot.createMany({
        data: slotsToCreate,
    });

    revalidatePath("/shows");
    revalidatePath("/schedule");
    redirect("/shows");
}

export async function getShows() {
    return await prisma.show.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getShow(id: string) {
    return await prisma.show.findUnique({
        where: { id },
    });
}

export async function updateShow(id: string, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const host = formData.get("host") as string;
    const image = formData.get("image") as string;
    const recordingEnabled = formData.get("recordingEnabled") === "true";
    const recordingSource = formData.get("recordingSource") as string;

    await prisma.show.update({
        where: { id },
        data: {
            title,
            description,
            type,
            host,
            image,
            recordingEnabled,
            recordingSource,
        },
    });

    revalidatePath("/shows");
    revalidatePath("/schedule");
    redirect("/shows");
}

export async function getScheduleSlots() {
    return await prisma.scheduleSlot.findMany({
        include: {
            show: true,
        },
    });
}

export async function createScheduleSlot(
    showId: string,
    startTime: Date,
    endTime: Date,
    sourceUrl?: string,
    isRecurring: boolean = false
) {
    await prisma.scheduleSlot.create({
        data: {
            showId,
            startTime,
            endTime,
            sourceUrl,
            isRecurring,
        },
    });
    revalidatePath("/schedule");
}


export async function updateScheduleSlot(
    id: string,
    startTime: Date,
    endTime: Date,
    isRecurring: boolean
) {
    await prisma.scheduleSlot.update({
        where: { id },
        data: {
            startTime,
            endTime,
            isRecurring,
        },
    });
    revalidatePath("/schedule");
}

export async function deleteScheduleSlot(id: string) {
    await prisma.scheduleSlot.delete({
        where: { id },
    });
    revalidatePath("/schedule");
}

export async function getEpisodes() {
    return await prisma.episode.findMany({
        include: {
            recording: {
                include: {
                    scheduleSlot: {
                        include: {
                            show: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getEpisode(id: string) {
    return await prisma.episode.findUnique({
        where: { id },
        include: {
            recording: true,
        },
    });
}

export async function updateEpisode(id: string, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const episodeNumber = formData.get("episodeNumber") ? parseInt(formData.get("episodeNumber") as string) : null;
    const seasonNumber = formData.get("seasonNumber") ? parseInt(formData.get("seasonNumber") as string) : null;

    await prisma.episode.update({
        where: { id },
        data: {
            title,
            description,
            episodeNumber,
            seasonNumber,
        },
    });

    revalidatePath("/episodes");
    revalidatePath(`/episodes/${id}`);
    redirect("/episodes");
}

export async function deleteShow(id: string) {
    await prisma.show.delete({
        where: { id },
    });
    revalidatePath("/shows");
    revalidatePath("/schedule");
    redirect("/shows");
}

// ============================================
// Icecast Stream Actions
// ============================================

export async function getStreams() {
    return await prisma.icecastStream.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getStream(id: string) {
    return await prisma.icecastStream.findUnique({
        where: { id },
    });
}

export async function createStream(name: string, url: string) {
    const { testStream } = await import("@/lib/stream-tester");

    // Test the stream before creating
    const testResult = await testStream(url);

    const stream = await prisma.icecastStream.create({
        data: {
            name,
            url,
            status: testResult.status,
            bitrate: testResult.bitrate,
            format: testResult.format,
            listeners: testResult.listeners,
            maxListeners: testResult.maxListeners,
            genre: testResult.genre,
            description: testResult.description,
            lastChecked: new Date(),
            errorMessage: testResult.errorMessage,
        },
    });

    revalidatePath("/streams");
    return stream;
}

export async function testStreamUrl(url: string) {
    const { testStream } = await import("@/lib/stream-tester");
    return await testStream(url);
}

export async function toggleStream(id: string, isEnabled: boolean) {
    await prisma.icecastStream.update({
        where: { id },
        data: { isEnabled },
    });
    revalidatePath("/streams");
}

export async function updateStreamStatus(id: string, testResult: any) {
    await prisma.icecastStream.update({
        where: { id },
        data: {
            status: testResult.status,
            bitrate: testResult.bitrate,
            format: testResult.format,
            listeners: testResult.listeners,
            maxListeners: testResult.maxListeners,
            genre: testResult.genre,
            description: testResult.description,
            lastChecked: new Date(),
            errorMessage: testResult.errorMessage,
        },
    });
    revalidatePath("/streams");
}

export async function refreshStream(id: string) {
    const stream = await prisma.icecastStream.findUnique({ where: { id } });
    if (!stream) return;

    const { testStream } = await import("@/lib/stream-tester");
    const testResult = await testStream(stream.url);

    await prisma.icecastStream.update({
        where: { id },
        data: {
            status: testResult.status,
            bitrate: testResult.bitrate,
            format: testResult.format,
            listeners: testResult.listeners,
            maxListeners: testResult.maxListeners,
            genre: testResult.genre,
            description: testResult.description,
            lastChecked: new Date(),
            errorMessage: testResult.errorMessage,
        },
    });
    revalidatePath("/streams");
}

export async function deleteStream(id: string) {
    await prisma.icecastStream.delete({
        where: { id },
    });
    revalidatePath("/streams");
}

export async function updateStream(id: string, name: string, url: string) {
    const { testStream } = await import("@/lib/stream-tester");

    // Test the new URL
    const testResult = await testStream(url);

    await prisma.icecastStream.update({
        where: { id },
        data: {
            name,
            url,
            status: testResult.status,
            bitrate: testResult.bitrate,
            format: testResult.format,
            listeners: testResult.listeners,
            maxListeners: testResult.maxListeners,
            genre: testResult.genre,
            description: testResult.description,
            lastChecked: new Date(),
            errorMessage: testResult.errorMessage,
        },
    });

    revalidatePath("/streams");
}

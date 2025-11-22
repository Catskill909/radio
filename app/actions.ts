'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createShow(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const host = (formData.get("host") as string) || null;
    const email = (formData.get("email") as string) || null;
    const author = (formData.get("author") as string) || null;
    const category = (formData.get("category") as string) || null;
    const tags = (formData.get("tags") as string) || null;
    const explicit = formData.get("explicit") === "true";
    const image = (formData.get("image") as string) || null;
    const recordingEnabled = formData.get("recordingEnabled") === "true";
    const recordingSource = (formData.get("recordingSource") as string) || null;
    const language = (formData.get("language") as string) || "en-us";
    const copyright = (formData.get("copyright") as string) || null;
    const link = (formData.get("link") as string) || null;

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
            email,
            author,
            category,
            tags,
            explicit,
            image,
            recordingEnabled,
            recordingSource,
            language,
            copyright,
            link,
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

            // Check for overlaps with existing slots
            const overlapping = await checkSlotOverlap(slotStart, slotEnd);
            if (overlapping) {
                throw new Error(
                    `Cannot create recurring show: Slot ${i + 1} (${slotStart.toLocaleDateString()}) would overlap with "${overlapping.show.title}"`
                );
            }

            slotsToCreate.push({
                showId: show.id,
                startTime: slotStart,
                endTime: slotEnd,
                isRecurring: true,
            });
        }
    } else {
        // Single slot - check for overlap
        const overlapping = await checkSlotOverlap(startDateTime, endDateTime);
        if (overlapping) {
            throw new Error(
                `Time slot overlaps with existing show: ${overlapping.show.title}`
            );
        }

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
    const host = (formData.get("host") as string) || null;
    const email = (formData.get("email") as string) || null;
    const author = (formData.get("author") as string) || null;
    const category = (formData.get("category") as string) || null;
    const tags = (formData.get("tags") as string) || null;
    const explicit = formData.get("explicit") === "true";
    const image = (formData.get("image") as string) || null;
    const recordingEnabled = formData.get("recordingEnabled") === "true";
    const recordingSource = (formData.get("recordingSource") as string) || null;
    const language = (formData.get("language") as string) || "en-us";
    const copyright = (formData.get("copyright") as string) || null;
    const link = (formData.get("link") as string) || null;

    await prisma.show.update({
        where: { id },
        data: {
            title,
            description,
            type,
            host,
            email,
            author,
            category,
            tags,
            explicit,
            image,
            recordingEnabled,
            recordingSource,
            language,
            copyright,
            link,
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

// Helper function to check for schedule slot overlaps
async function checkSlotOverlap(
    startTime: Date,
    endTime: Date,
    excludeId?: string
) {
    return await prisma.scheduleSlot.findFirst({
        where: {
            ...(excludeId && { id: { not: excludeId } }),
            OR: [
                {
                    // New start time falls within existing slot
                    startTime: { lte: startTime },
                    endTime: { gt: startTime },
                },
                {
                    // New end time falls within existing slot
                    startTime: { lt: endTime },
                    endTime: { gte: endTime },
                },
                {
                    // New slot completely encompasses existing slot
                    startTime: { gte: startTime },
                    endTime: { lte: endTime },
                },
            ],
        },
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
    const slotsToCreate = [];

    if (isRecurring) {
        // Generate slots for the next 12 weeks (approx 3 months)
        for (let i = 0; i < 12; i++) {
            const slotStart = new Date(startTime);
            slotStart.setDate(slotStart.getDate() + (i * 7));

            const slotEnd = new Date(endTime);
            slotEnd.setDate(slotEnd.getDate() + (i * 7));

            // Check for overlaps with existing slots
            const overlapping = await checkSlotOverlap(slotStart, slotEnd);
            if (overlapping) {
                throw new Error(
                    `Cannot create recurring show: Slot ${i + 1} (${slotStart.toLocaleDateString()}) would overlap with "${overlapping.show.title}"`
                );
            }

            slotsToCreate.push({
                showId,
                startTime: slotStart,
                endTime: slotEnd,
                sourceUrl,
                isRecurring: true,
            });
        }
    } else {
        // Single slot - check for overlap
        const overlapping = await checkSlotOverlap(startTime, endTime);
        if (overlapping) {
            throw new Error(`Time slot overlaps with existing show: ${overlapping.show.title}`);
        }

        slotsToCreate.push({
            showId,
            startTime,
            endTime,
            sourceUrl,
            isRecurring: false,
        });
    }

    await prisma.scheduleSlot.createMany({
        data: slotsToCreate,
    });

    revalidatePath("/schedule");
}


export async function updateScheduleSlot(
    id: string,
    startTime: Date,
    endTime: Date,
    isRecurring: boolean
) {
    // Check for overlaps using the helper function
    const overlapping = await checkSlotOverlap(startTime, endTime, id);

    if (overlapping) {
        throw new Error(`Time slot overlaps with existing show: ${overlapping.show.title}`);
    }

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


export async function getRecordings() {
    return await prisma.recording.findMany({
        include: {
            scheduleSlot: {
                include: {
                    show: true,
                },
            },
            episode: true,
        },
        orderBy: {
            startTime: 'desc',
        },
    });
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

export async function getShowsWithEpisodes() {
    const shows = await prisma.show.findMany({
        include: {
            slots: {
                include: {
                    recordings: {
                        include: {
                            episode: true
                        }
                    }
                }
            }
        },
        orderBy: { title: 'asc' }
    });

    // Transform data to get episodes per show
    return shows.map(show => {
        // Flatten all episodes from all slots/recordings
        const episodes = show.slots.flatMap(slot =>
            slot.recordings
                .filter(r => r.episode)
                .map(r => ({
                    ...r.episode!,
                    recording: r // Keep recording data for file path
                }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
            ...show,
            episodes,
            latestEpisode: episodes[0] || null,
            totalEpisodes: episodes.length
        };
    });
}

export async function getRecording(id: string) {
    return await prisma.recording.findUnique({
        where: { id },
        include: {
            scheduleSlot: {
                include: {
                    show: true,
                },
            },
            episode: true,
        },
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

export async function getEpisodesForShow(showId: string) {
    // Get all episodes for a specific show through the recording -> scheduleSlot -> show relationship
    const episodes = await prisma.episode.findMany({
        where: {
            recording: {
                scheduleSlot: {
                    showId: showId
                }
            }
        },
        include: {
            recording: {
                include: {
                    scheduleSlot: {
                        include: {
                            show: true
                        }
                    }
                }
            }
        },
        orderBy: {
            publishedAt: 'desc'
        }
    });

    return episodes;
}

export async function updateEpisode(id: string, formData: FormData) {
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const episodeNumber = formData.get("episodeNumber") ? parseInt(formData.get("episodeNumber") as string) : null;
    const seasonNumber = formData.get("seasonNumber") ? parseInt(formData.get("seasonNumber") as string) : null;
    const host = (formData.get("host") as string) || null;
    const imageUrl = (formData.get("image") as string) || null;
    const tags = (formData.get("tags") as string) || null;
    const explicit = formData.get("explicit") === "true" ? true : formData.get("explicit") === "false" ? false : null;

    // Get the episode to find the show ID for RSS feed revalidation
    const episode = await prisma.episode.findUnique({
        where: { id },
        include: {
            recording: {
                include: {
                    scheduleSlot: true
                }
            }
        }
    });

    await prisma.episode.update({
        where: { id },
        data: {
            title,
            description,
            episodeNumber,
            seasonNumber,
            host,
            imageUrl,
            tags,
            explicit,
        },
    });

    // Revalidate relevant paths including RSS feed
    revalidatePath("/episodes");
    revalidatePath(`/episodes/${id}`);

    // Revalidate RSS feed if we have a show ID
    if (episode?.recording?.scheduleSlot?.showId) {
        revalidatePath(`/api/feed/${episode.recording.scheduleSlot.showId}/rss.xml`);
    }
}

export async function publishRecording(recordingId: string, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const episodeNumber = formData.get("episodeNumber") ? parseInt(formData.get("episodeNumber") as string) : null;
    const seasonNumber = formData.get("seasonNumber") ? parseInt(formData.get("seasonNumber") as string) : null;

    // Get optional overrides from form
    const customHost = formData.get("host") as string;
    const customImage = formData.get("image") as string;
    const customTags = formData.get("tags") as string;

    // Fetch recording to get duration and show defaults
    const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
        include: {
            scheduleSlot: {
                include: {
                    show: true
                }
            }
        }
    });

    if (!recording) {
        throw new Error("Recording not found");
    }

    const show = recording.scheduleSlot?.show;

    await prisma.episode.create({
        data: {
            recordingId,
            title,
            description,
            episodeNumber,
            seasonNumber,
            publishedAt: new Date(),
            duration: recording.duration || 0,
            // Use form value -> show value -> null
            host: customHost || show?.host || null,
            imageUrl: customImage || show?.image || null,
            // tags: customTags || show?.tags || null // Show doesn't have tags yet in schema, so just custom or null
            tags: customTags || null
        },
    });

    revalidatePath("/recordings");
    revalidatePath("/episodes");
    redirect("/recordings");
}

export async function deleteShow(id: string) {
    // Check if show exists first
    const show = await prisma.show.findUnique({
        where: { id },
    });

    if (!show) {
        // Show already deleted or doesn't exist - just revalidate and redirect
        revalidatePath("/shows");
        revalidatePath("/schedule");
        redirect("/shows");
        return;
    }

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

    // Trim URL to remove any whitespace
    const cleanUrl = url.trim();

    // Test the stream before creating
    const testResult = await testStream(cleanUrl);

    const stream = await prisma.icecastStream.create({
        data: {
            name,
            url: cleanUrl,
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
    if (!stream) return null;

    const { testStream } = await import("@/lib/stream-tester");
    const testResult = await testStream(stream.url);

    const updatedStream = await prisma.icecastStream.update({
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
    return updatedStream;
}

export async function deleteStream(id: string) {
    await prisma.icecastStream.delete({
        where: { id },
    });
    revalidatePath("/streams");
}

export async function updateStream(id: string, name: string, url: string) {
    const { testStream } = await import(`@/lib/stream-tester`);

    // Trim URL to remove any whitespace
    const cleanUrl = url.trim();

    const testResult = await testStream(cleanUrl);

    await prisma.icecastStream.update({
        where: { id },
        data: {
            name,
            url: cleanUrl,
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

export async function deleteRecording(id: string) {
    const fs = await import("fs");
    const path = await import("path");

    // 1. Get the recording to find the file path
    const recording = await prisma.recording.findUnique({
        where: { id },
    });

    if (!recording) {
        throw new Error("Recording not found");
    }

    // 2. Delete the file from filesystem
    if (recording.filePath) {
        const filePath = path.join(process.cwd(), "recordings", recording.filePath);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            } catch (error) {
                console.error(`Error deleting file ${filePath}:`, error);
            }
        }
    }

    // 3. Delete from database
    const episode = await prisma.episode.findUnique({
        where: { recordingId: id }
    });

    if (episode) {
        await prisma.episode.delete({
            where: { id: episode.id }
        });
    }

    await prisma.recording.delete({
        where: { id },
    });

    revalidatePath("/recordings");
    revalidatePath("/episodes");
}

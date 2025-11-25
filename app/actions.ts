'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { stationTimeToUTC } from "@/lib/station-time";

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

    // Only create schedule slots if scheduling info is provided
    if (startDateStr && startTimeStr && !isNaN(durationMins) && durationMins > 0) {
        // Calculate initial start and end time
        // ✅ STATION TIMEZONE: Interpret user input as station-local time, convert to UTC for DB
        const startDateTime = stationTimeToUTC(startDateStr, startTimeStr);
        const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

        // Generate slots
        const slotsToCreate = [];

        if (isRecurring) {
            // ✅ DST-AWARE: Use timezone-aware date arithmetic to maintain wall-clock time
            const { add } = await import('date-fns');
            const { toZonedTime, fromZonedTime, format } = await import('date-fns-tz');
            const { getStationTimezone } = await import('@/lib/station-time');
            const stationTz = getStationTimezone();

            // Generate slots for the next 52 weeks (1 year) - radio shows run indefinitely
            for (let i = 0; i < 52; i++) {
                // Convert initial UTC time to station timezone
                const initialStationStart = toZonedTime(startDateTime, stationTz);
                const initialStationEnd = toZonedTime(endDateTime, stationTz);

                // Add weeks in STATION TIMEZONE (maintains wall-clock time across DST)
                const futureStationStart = add(initialStationStart, { weeks: i });
                const futureStationEnd = add(initialStationEnd, { weeks: i });

                // Convert back to UTC for database storage
                // date-fns-tz handles DST offset changes automatically
                const slotStart = fromZonedTime(
                    format(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                    stationTz
                );
                const slotEnd = fromZonedTime(
                    format(futureStationEnd, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                    stationTz
                );

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
    }

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
    startTime: Date,  // Date from browser - serialized to UTC when sent to server
    endTime: Date,    // Date from browser - serialized to UTC when sent to server
    sourceUrl?: string,
    isRecurring: boolean = false
) {
    // Get station timezone and conversion utilities
    const { getStationTimezone } = await import('@/lib/station-time');
    const { toZonedTime, fromZonedTime } = await import('date-fns-tz');
    const stationTz = getStationTimezone();

    // Note: startTime and endTime are already UTC Dates after client->server serialization
    // We just need to convert to station time for midnight detection
    const slotsToCreate = [];

    // Convert UTC dates to station time for midnight detection
    const startStation = toZonedTime(startTime, stationTz);
    const endStation = toZonedTime(endTime, stationTz);

    // Check if slot crosses midnight IN STATION TIMEZONE
    const crossesMidnight = startStation.getDate() !== endStation.getDate() ||
        startStation.getMonth() !== endStation.getMonth() ||
        startStation.getFullYear() !== endStation.getFullYear();

    if (crossesMidnight) {
        // Generate a unique group ID for linked slots
        const splitGroupId = crypto.randomUUID();

        // Calculate midnight boundary IN STATION TIMEZONE
        const midnightStation = new Date(startStation);
        midnightStation.setDate(midnightStation.getDate() + 1);
        midnightStation.setHours(0, 0, 0, 0);

        // Convert midnight back to UTC for storage
        const midnight = fromZonedTime(
            `${midnightStation.getFullYear()}-${String(midnightStation.getMonth() + 1).padStart(2, '0')}-${String(midnightStation.getDate()).padStart(2, '0')}T00:00:00`,
            stationTz
        );

        if (isRecurring) {
            // ✅ DST-AWARE: Generate pairs of slots for the next 52 weeks with timezone logic
            const { add } = await import('date-fns');
            const { toZonedTime, fromZonedTime, format } = await import('date-fns-tz');

            for (let i = 0; i < 52; i++) {
                // Convert to station time and add weeks
                const initialSlot1Start = toZonedTime(startTime, stationTz);
                const initialMidnight = toZonedTime(midnight, stationTz);
                const initialSlot2End = toZonedTime(endTime, stationTz);

                const futureSlot1Start = add(initialSlot1Start, { weeks: i });
                const futureMidnight = add(initialMidnight, { weeks: i });
                const futureSlot2End = add(initialSlot2End, { weeks: i });

                // Convert back to UTC
                const slot1Start = fromZonedTime(
                    format(futureSlot1Start, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                    stationTz
                );
                const slot1End = fromZonedTime(
                    format(futureMidnight, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                    stationTz
                );
                const slot2Start = slot1End; // Midnight is the boundary
                const slot2End = fromZonedTime(
                    format(futureSlot2End, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                    stationTz
                );

                // Check for overlaps
                const overlap1 = await checkSlotOverlap(slot1Start, slot1End);
                const overlap2 = await checkSlotOverlap(slot2Start, slot2End);

                if (overlap1) {
                    throw new Error(
                        `Cannot create recurring show: Week ${i + 1} first half overlaps with "${overlap1.show.title}"`
                    );
                }
                if (overlap2) {
                    throw new Error(
                        `Cannot create recurring show: Week ${i + 1} second half overlaps with "${overlap2.show.title}"`
                    );
                }

                slotsToCreate.push(
                    {
                        showId,
                        startTime: slot1Start,
                        endTime: slot1End,
                        sourceUrl,
                        isRecurring: true,
                        splitGroupId: `${splitGroupId}-week${i}`,
                        splitPosition: 'first'
                    },
                    {
                        showId,
                        startTime: slot2Start,
                        endTime: slot2End,
                        sourceUrl,
                        isRecurring: true,
                        splitGroupId: `${splitGroupId}-week${i}`,
                        splitPosition: 'second'
                    }
                );
            }
        } else {
            // Single pair of slots
            const overlap1 = await checkSlotOverlap(startTime, midnight);
            const overlap2 = await checkSlotOverlap(midnight, endTime);

            if (overlap1) {
                throw new Error(`First half of time slot overlaps with existing show: ${overlap1.show.title}`);
            }
            if (overlap2) {
                throw new Error(`Second half of time slot overlaps with existing show: ${overlap2.show.title}`);
            }

            slotsToCreate.push(
                {
                    showId,
                    startTime: startTime,
                    endTime: midnight,
                    sourceUrl,
                    isRecurring: false,
                    splitGroupId,
                    splitPosition: 'first'
                },
                {
                    showId,
                    startTime: midnight,
                    endTime: endTime,
                    sourceUrl,
                    isRecurring: false,
                    splitGroupId,
                    splitPosition: 'second'
                }
            );
        }
    } else {
        // Same-day slots (existing logic)
        if (isRecurring) {
            // Generate slots for the next 52 weeks (1 year) - radio shows run indefinitely
            for (let i = 0; i < 52; i++) {
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
                    splitGroupId: null,
                    splitPosition: null,
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
                startTime: startTime,
                endTime: endTime,
                sourceUrl,
                isRecurring: false,
                splitGroupId: null,
                splitPosition: null,
            });
        }
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
    // Get the existing slot to check if recurring status changed
    const existingSlot = await prisma.scheduleSlot.findUnique({
        where: { id },
        include: { show: true }
    });

    if (!existingSlot) {
        throw new Error("Schedule slot not found");
    }

    // Check for overlaps using the helper function
    const overlapping = await checkSlotOverlap(startTime, endTime, id);

    if (overlapping) {
        throw new Error(`Time slot overlaps with existing show: ${overlapping.show.title}`);
    }

    // Update the existing slot
    await prisma.scheduleSlot.update({
        where: { id },
        data: {
            startTime,
            endTime,
            isRecurring,
        },
    });

    // If toggling recurring ON, generate future slots
    if (isRecurring && !existingSlot.isRecurring) {
        // ✅ DST-AWARE: Generate future slots with timezone logic
        const { add } = await import('date-fns');
        const { toZonedTime, fromZonedTime, format } = await import('date-fns-tz');
        const { getStationTimezone } = await import('@/lib/station-time');
        const stationTz = getStationTimezone();

        const duration = endTime.getTime() - startTime.getTime();
        const slotsToCreate = [];

        // Generate 51 additional weeks (slot 0 is the updated existing one)
        for (let i = 1; i < 52; i++) {
            // Convert to station time
            const initialStationStart = toZonedTime(startTime, stationTz);
            const initialStationEnd = toZonedTime(endTime, stationTz);

            // Add weeks in station timezone
            const futureStationStart = add(initialStationStart, { weeks: i });
            const futureStationEnd = add(initialStationEnd, { weeks: i });

            // Convert back to UTC
            const slotStart = fromZonedTime(
                format(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                stationTz
            );
            const slotEnd = fromZonedTime(
                format(futureStationEnd, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                stationTz
            );

            // Check for overlaps
            const overlapping = await checkSlotOverlap(slotStart, slotEnd, id);
            if (overlapping) {
                throw new Error(
                    `Cannot create recurring slots: Slot ${i + 1} (${slotStart.toLocaleDateString()}) would overlap with "${overlapping.show.title}"`
                );
            }

            slotsToCreate.push({
                showId: existingSlot.showId,
                startTime: slotStart,
                endTime: slotEnd,
                isRecurring: true,
            });
        }

        await prisma.scheduleSlot.createMany({
            data: slotsToCreate,
        });
    }

    revalidatePath("/schedule");
}

export async function deleteScheduleSlot(
    id: string,
    options?: {
        deleteMode?: 'single' | 'this-and-future';
        deleteBothParts?: boolean;
    }
) {
    const slot = await prisma.scheduleSlot.findUnique({
        where: { id },
        include: { show: true }
    });

    if (!slot) {
        throw new Error("Schedule slot not found");
    }

    const slotsToDelete: string[] = [id];

    // Handle split shows (delete both parts)
    if (options?.deleteBothParts && slot.splitGroupId) {
        const linkedSlot = await prisma.scheduleSlot.findFirst({
            where: {
                splitGroupId: slot.splitGroupId,
                id: { not: id }
            }
        });
        if (linkedSlot) {
            slotsToDelete.push(linkedSlot.id);
        }
    }

    // Handle recurring shows - MATCH BY TIME SLOT PATTERN (day-of-week + time-of-day)
    // CRITICAL: Use station timezone, not UTC, as the single source of truth
    if (options?.deleteMode === 'this-and-future' && slot.isRecurring) {
        // Get station timezone utilities
        const { utcToStationTime } = await import('@/lib/station-time');

        // Extract time pattern from the slot being deleted
        // Convert UTC time to station time first!
        const slotDateStation = utcToStationTime(slot.startTime);
        const dayOfWeek = slotDateStation.getDay();
        const hourOfDay = slotDateStation.getHours();
        const minuteOfHour = slotDateStation.getMinutes();

        // Get all future recurring slots for this show
        const futureSlots = await prisma.scheduleSlot.findMany({
            where: {
                showId: slot.showId,
                isRecurring: true,
                startTime: { gte: slot.startTime }
            }
        });

        // Filter by matching time pattern (same day-of-week and time-of-day in STATION timezone)
        const matchingSlots = futureSlots.filter(futureSlot => {
            const futureStationTime = utcToStationTime(futureSlot.startTime);
            return futureStationTime.getDay() === dayOfWeek &&
                futureStationTime.getHours() === hourOfDay &&
                futureStationTime.getMinutes() === minuteOfHour;
        });

        for (const matchingSlot of matchingSlots) {
            if (!slotsToDelete.includes(matchingSlot.id)) {
                slotsToDelete.push(matchingSlot.id);
            }

            // If deleting both parts, also delete linked splits of future instances
            if (options?.deleteBothParts && matchingSlot.splitGroupId) {
                const futureLinked = await prisma.scheduleSlot.findFirst({
                    where: {
                        splitGroupId: matchingSlot.splitGroupId,
                        id: { not: matchingSlot.id }
                    }
                });
                if (futureLinked && !slotsToDelete.includes(futureLinked.id)) {
                    slotsToDelete.push(futureLinked.id);
                }
            }
        }
    }

    // Delete all collected slot IDs
    await prisma.scheduleSlot.deleteMany({
        where: {
            id: { in: slotsToDelete }
        }
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

    // Check for audio file replacement
    const newAudioFile = formData.get("newAudioFile") as string | null;
    const newAudioDuration = formData.get("newAudioDuration") ? parseInt(formData.get("newAudioDuration") as string) : null;
    const newAudioSize = formData.get("newAudioSize") ? parseInt(formData.get("newAudioSize") as string) : null;

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

    if (!episode) {
        throw new Error("Episode not found");
    }

    // Handle audio file replacement
    if (newAudioFile && newAudioDuration !== null) {
        const fs = await import("fs");
        const path = await import("path");

        // Delete old audio file
        const oldFilePath = path.join(process.cwd(), "recordings", episode.recording.filePath);
        if (fs.existsSync(oldFilePath)) {
            try {
                fs.unlinkSync(oldFilePath);
                console.log(`Deleted old audio file: ${oldFilePath}`);
            } catch (error) {
                console.error(`Error deleting old audio file ${oldFilePath}:`, error);
            }
        }

        // Update recording with new file info
        await prisma.recording.update({
            where: { id: episode.recording.id },
            data: {
                filePath: newAudioFile,
                duration: newAudioDuration,
                size: newAudioSize
            }
        });
    }

    // Update episode metadata
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
            // Update duration if new audio was uploaded
            ...(newAudioDuration !== null && { duration: newAudioDuration })
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
        // Show already deleted or doesn't exist - just revalidate
        revalidatePath("/shows");
        revalidatePath("/schedule");
        return;
    }

    await prisma.show.delete({
        where: { id },
    });
    revalidatePath("/shows");
    revalidatePath("/schedule");
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

export async function getStationSettings() {
    const settings = await prisma.stationSettings.findUnique({
        where: { id: 'station' }
    });

    if (!settings) {
        // Return defaults if no settings exist
        return {
            timezone: 'UTC',
            name: 'My Radio Station',
            description: null,
            email: null,
            logoUrl: null
        };
    }

    return settings;
}

export async function updateStationTimezoneAction(formData: FormData) {
    const timezone = formData.get("timezone");

    if (!timezone || typeof timezone !== "string" || timezone.trim() === "") {
        return;
    }

    await prisma.stationSettings.upsert({
        where: { id: 'station' },
        update: { timezone },
        create: {
            id: 'station',
            timezone
        }
    });

    revalidatePath("/settings");
    revalidatePath("/schedule");
}

export async function updateStationIdentityAction(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const email = formData.get('email') as string;
    const logoUrl = formData.get('logoUrl') as string;

    console.log('Updating Station Identity:', { name, description, email, logoUrl });

    try {
        await prisma.stationSettings.upsert({
            where: { id: 'station' },
            update: {
                name,
                description,
                email,
                logoUrl,
            },
            create: {
                id: 'station',
                timezone: 'UTC',
                name,
                description,
                email,
                logoUrl,
            },
        });
        console.log('Station Identity updated successfully');
    } catch (error) {
        console.error('Error updating Station Identity:', error);
        throw error;
    }

    revalidatePath('/settings');
    revalidatePath('/'); // Revalidate home in case it's used there
}

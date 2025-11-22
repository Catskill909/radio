"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface StationClockProps {
  timezone: string;
}

function formatTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function formatDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    timeZone: timezone,
  }).format(date);
}

function formatZoneLabel(timezone: string) {
  return timezone.replace(/_/g, " ");
}

export default function StationClock({ timezone }: StationClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  const zoneLabel = formatZoneLabel(timezone);

  if (!now) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-700 shadow-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-400">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-widest tabular-nums">
            --:--:--
          </span>
          <span className="text-xs text-gray-400">
            Loading - {zoneLabel}
          </span>
        </div>
      </div>
    );
  }

  let time: string;
  let dateLabel: string;

  try {
    time = formatTime(now, timezone);
    dateLabel = formatDate(now, timezone);
  } catch {
    time = formatTime(now, "UTC");
    dateLabel = formatDate(now, "UTC");
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-700 shadow-sm">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-400">
        <Clock className="w-4 h-4" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-widest tabular-nums">
          {time}
        </span>
        <span className="text-xs text-gray-400">
          {dateLabel} - {zoneLabel}
        </span>
      </div>
    </div>
  );
}


import { getStationSettings } from "@/app/actions";
import StationClock from "@/components/StationClock";
import StationIdentityForm from "@/components/StationIdentityForm";
import StationTimezoneForm from "@/components/StationTimezoneForm";

export default async function SettingsPage() {
    const settings = await getStationSettings();
    const timezone = settings.timezone || "UTC";

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Settings</h1>
                    <p className="text-gray-400 mt-2">Configure station-wide preferences like timezone and identity.</p>
                </div>
                <div className="flex-shrink-0">
                    <StationClock timezone={timezone} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-8">
                {/* Full Width: Station Identity */}
                <StationIdentityForm initialSettings={settings} />

                {/* Below: Timezone Controls */}
                <div className="max-w-md">
                    <StationTimezoneForm initialTimezone={timezone} />
                </div>
            </div>
        </div>
    );
}

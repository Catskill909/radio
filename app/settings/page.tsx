import { getStationSettings, getStreams } from "@/app/actions";
import StationClock from "@/components/StationClock";
import StationIdentityForm from "@/components/StationIdentityForm";
import StationTimezoneForm from "@/components/StationTimezoneForm";
import StationStreamForm from "@/components/StationStreamForm";

export default async function SettingsPage() {
    const settings = await getStationSettings();
    const streams = await getStreams();
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Timezone Controls */}
                    <div className="max-w-md w-full">
                        <StationTimezoneForm initialTimezone={timezone} />
                    </div>

                    {/* Right: Stream Controls */}
                    <div className="max-w-md w-full">
                        <StationStreamForm
                            initialStreamUrl={(settings as any).streamUrl}
                            availableStreams={streams}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

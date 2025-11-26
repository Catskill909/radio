import { getStationSettings, getStreams } from "@/app/actions";
import StationClock from "@/components/StationClock";
import StationIdentityForm from "@/components/StationIdentityForm";
import StationTimezoneForm from "@/components/StationTimezoneForm";
import StationStreamForm from "@/components/StationStreamForm";
import AudioEncodingSettings from "@/components/AudioEncodingSettings";
import HelpIcon from '@/components/HelpIcon'; // Added import

export default async function SettingsPage() {
    const settings = await getStationSettings();
    const streams = await getStreams();
    const timezone = settings.timezone || "UTC";

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Settings
                        <HelpIcon articleId="station-settings" tooltip="Configure station-wide preferences like timezone and identity." />
                    </h1>
                    <p className="text-gray-400 mt-2">Configure station-wide preferences like timezone and identity.</p>
                </div>
                <div className="flex-shrink-0">
                    <StationClock timezone={timezone} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-8">
                {/* Full Width: Station Identity */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Station Identity
                        <HelpIcon articleId="station-identity" tooltip="Set your station's name, description, and logo." />
                    </h2>
                    <StationIdentityForm initialSettings={settings} />
                </section>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Timezone Controls */}
                    <div className="max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            Timezone Configuration
                            <HelpIcon articleId="station-timezone" tooltip="Set the timezone for your station's operations and scheduling." />
                        </h2>
                        <StationTimezoneForm initialTimezone={timezone} />
                    </div>

                    {/* Right: Stream Controls */}
                    <div className="max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            Default Stream
                            <HelpIcon articleId="station-stream" tooltip="Select the default stream for your station." />
                        </h2>
                        <StationStreamForm
                            initialStreamUrl={(settings as any).streamUrl}
                            availableStreams={streams}
                        />
                    </div>
                </div>

                {/* Full Width: Audio Encoding Settings */}
                <AudioEncodingSettings
                    initialSettings={{
                        audioCodec: (settings as any).audioCodec || 'libmp3lame',
                        audioBitrate: (settings as any).audioBitrate || 192,
                        audioSampleRate: (settings as any).audioSampleRate || null,
                        audioVBR: (settings as any).audioVBR ?? true,
                    }}
                />
            </div>
        </div>
    );
}

import { getStationSettings, updateStationTimezoneAction } from "@/app/actions";
import StationClock from "@/components/StationClock";

const TIMEZONES = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "Europe/London", label: "London (UK)" },
    { value: "Europe/Berlin", label: "Central Europe" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Australia/Sydney", label: "Sydney" },
];

import StationIdentityForm from "@/components/StationIdentityForm";

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-y-auto pb-8">
                {/* Left Column: Identity */}
                <StationIdentityForm initialSettings={settings} />

                {/* Right Column: Regional & Preview */}
                <div className="space-y-8">
                    <form
                        action={updateStationTimezoneAction}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4"
                    >
                        <h2 className="text-lg font-semibold text-gray-100">Station Timezone</h2>
                        <p className="text-sm text-gray-400">
                            This timezone is used for the schedule clock and should match your station&apos;s local time.
                        </p>

                        <div className="space-y-2">
                            <label htmlFor="timezone" className="block text-sm font-medium text-gray-300">
                                Timezone
                            </label>
                            <select
                                id="timezone"
                                name="timezone"
                                defaultValue={timezone}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
                        >
                            Save Timezone
                        </button>
                    </form>

                    <div className="flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl bg-gray-900/40 p-8">
                        <div className="max-w-xs text-center space-y-3">
                            <h3 className="font-semibold text-gray-100">Clock Preview</h3>
                            <p className="text-sm text-gray-400">
                                The schedule view will show this clock in the top-right corner using your selected timezone.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

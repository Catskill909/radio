import { getStationSettings, getStreams, getMenuSettings, getAcrcloudSettings, getSmtpSettings, getAlertSettings } from "@/app/actions";
import StationClock from "@/components/StationClock";
import StationIdentityForm from "@/components/StationIdentityForm";
import StationTimezoneForm from "@/components/StationTimezoneForm";
import StationStreamForm from "@/components/StationStreamForm";
import AudioEncodingSettings from "@/components/AudioEncodingSettings";
import SiteBrandingForm from "@/components/SiteBrandingForm";
import CustomMenuForm from "@/components/CustomMenuForm";
import HelpIcon from '@/components/HelpIcon';
import DataManagement from "@/components/DataManagement";
import ACRCloudSettings from "@/components/ACRCloudSettings";
import ArchiveManagement from "@/components/ArchiveManagement";
import SMTPConfigForm from "@/components/SMTPConfigForm";
import AlertEmailSettings from "@/components/AlertEmailSettings";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Settings',
};

export default async function SettingsPage() {
    const settings = await getStationSettings();
    const streams = await getStreams();
    const menuSettings = await getMenuSettings();
    const acrcloudSettings = await getAcrcloudSettings();
    const smtpSettings = await getSmtpSettings();
    const alertSettings = await getAlertSettings();
    const timezone = settings.timezone || "UTC";

    return (
        <div className="overflow-y-auto pb-8 pr-4 space-y-8">
            {/* Header - now scrolls with content */}
            <div className="bg-gray-950 pb-6">
                <div className="flex items-center justify-between gap-4 pt-6 px-6">
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
            </div>

            <div className="px-6 space-y-8">
                {/* Full Width: Site Branding (Public Front-End) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Site Branding
                        <HelpIcon articleId="site-branding" tooltip="Customize your station's branding on the public listen page." />
                    </h2>
                    <SiteBrandingForm
                        initialSettings={{
                            siteLogo: settings.siteLogo as string | null | undefined,
                            siteTitle: settings.siteTitle as string | null | undefined,
                            siteTagline: settings.siteTagline as string | null | undefined,
                            showSiteLogo: settings.showSiteLogo as boolean | undefined,
                            showSiteTitle: settings.showSiteTitle as boolean | undefined,
                            showSiteTagline: settings.showSiteTagline as boolean | undefined,
                        }}
                    />
                </section>

                {/* Full Width: Custom Menu (Public Front-End) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Custom Menu
                        <HelpIcon articleId="custom-menu" tooltip="Configure the floating menu on your public listen page." />
                    </h2>
                    <CustomMenuForm
                        initialMenuEnabled={menuSettings.menuEnabled}
                        initialMenuItems={menuSettings.menuItems}
                    />
                </section>

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

                {/* Full Width: Data Management (Import/Export) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Data Management
                        <HelpIcon articleId="import-export-data" tooltip="Import and export your station data." />
                    </h2>
                    <DataManagement />
                </section>

                {/* Full Width: Audio Encoding Settings */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Audio Recording Quality
                        <HelpIcon articleId="audio-encoding-quality" tooltip="Configure encoding settings for recorded shows." />
                    </h2>
                    <AudioEncodingSettings
                        initialSettings={{
                            audioCodec: (settings as any).audioCodec || 'libmp3lame',
                            audioBitrate: (settings as any).audioBitrate || 192,
                            audioSampleRate: (settings as any).audioSampleRate || null,
                            audioVBR: (settings as any).audioVBR ?? true,
                        }}
                    />
                </section>

                {/* Full Width: Archive Management */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Archive Management
                        <HelpIcon articleId="rss-episode-controls" tooltip="Manage archived episodes beyond your feed limit." />
                    </h2>
                    <ArchiveManagement timezone={timezone} />
                </section>

                {/* Full Width: ACRCloud Song Recognition */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Song Recognition
                        <HelpIcon articleId="song-recognition" tooltip="Automatically identify songs playing on your stream." />
                    </h2>
                    <ACRCloudSettings
                        initialSettings={acrcloudSettings}
                        availableStreams={streams}
                    />
                </section>

                {/* Full Width: Email Configuration (SMTP) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Email Configuration
                        <HelpIcon articleId="email-configuration" tooltip="Configure SMTP settings for sending alert emails." />
                    </h2>
                    <SMTPConfigForm initialSettings={smtpSettings} />
                </section>

                {/* Full Width: Stream Alert Notifications */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Stream Alerts
                        <HelpIcon articleId="stream-alerts" tooltip="Get notified when streams go offline." />
                    </h2>
                    <AlertEmailSettings initialSettings={alertSettings} />
                </section>
            </div>
        </div>
    );
}

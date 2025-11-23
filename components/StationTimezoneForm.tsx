'use client';

import { useState } from 'react';
import { updateStationTimezoneAction } from '@/app/actions';
import { Save, Globe, CheckCircle, AlertCircle } from 'lucide-react';

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

interface StationTimezoneFormProps {
    initialTimezone: string;
}

export default function StationTimezoneForm({ initialTimezone }: StationTimezoneFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        setStatus(null);

        try {
            await updateStationTimezoneAction(formData);
            setStatus({ type: 'success', message: 'Timezone saved successfully!' });

            // Clear success message after 5 seconds
            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error('Failed to save timezone:', error);
            setStatus({
                type: 'error',
                message: 'Failed to save timezone. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form action={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 h-fit relative">
            <div>
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Station Timezone
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    This timezone is used for the schedule clock and should match your station&apos;s local time.
                </p>
            </div>

            {status && (
                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${status.type === 'success'
                    ? 'bg-gray-900 border-green-500/50 text-green-400'
                    : 'bg-gray-900 border-red-500/50 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="font-medium">{status.message}</p>
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-300">
                    Timezone
                </label>
                <select
                    id="timezone"
                    name="timezone"
                    defaultValue={initialTimezone}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                            {tz.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="pt-2 border-t border-gray-800">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Timezone
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

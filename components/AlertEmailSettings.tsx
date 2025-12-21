'use client';

import { useState } from 'react';
import { updateAlertSettings } from '@/app/actions';
import { Check, Bell, Plus, X, Users, Clock, AlertCircle } from 'lucide-react';
import Switch from './Switch';
import HelpIcon from './HelpIcon';

interface AlertEmailSettingsProps {
    initialSettings: {
        alertEmails: string[];
        alertAllStreams: boolean;
        alertCooldownMins: number;
        alertOnRecovery: boolean;
        hasSmtpConfigured: boolean;
    };
}

// Cooldown options in minutes
const COOLDOWN_OPTIONS = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
];

export default function AlertEmailSettings({ initialSettings }: AlertEmailSettingsProps) {
    // Email list state
    const [emails, setEmails] = useState<string[]>(initialSettings.alertEmails);
    const [newEmail, setNewEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);

    // Settings state
    const [alertAllStreams, setAlertAllStreams] = useState(initialSettings.alertAllStreams);
    const [alertCooldownMins, setAlertCooldownMins] = useState(initialSettings.alertCooldownMins);
    const [alertOnRecovery, setAlertOnRecovery] = useState(initialSettings.alertOnRecovery);

    // Save state
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track unsaved changes
    const hasChanges =
        JSON.stringify(emails) !== JSON.stringify(initialSettings.alertEmails) ||
        alertAllStreams !== initialSettings.alertAllStreams ||
        alertCooldownMins !== initialSettings.alertCooldownMins ||
        alertOnRecovery !== initialSettings.alertOnRecovery;

    // Validate email format
    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Add email to list
    const handleAddEmail = () => {
        const trimmedEmail = newEmail.trim().toLowerCase();

        if (!trimmedEmail) {
            setEmailError('Please enter an email address');
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        if (emails.includes(trimmedEmail)) {
            setEmailError('This email is already in the list');
            return;
        }

        setEmails([...emails, trimmedEmail]);
        setNewEmail('');
        setEmailError(null);
    };

    // Remove email from list
    const handleRemoveEmail = (emailToRemove: string) => {
        setEmails(emails.filter(e => e !== emailToRemove));
    };

    // Handle enter key in email input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    // Handle save
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await updateAlertSettings(
                emails,
                alertAllStreams,
                alertCooldownMins,
                alertOnRecovery
            );
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-orange-400" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">Stream Alert Notifications</h2>
                        <p className="text-sm text-gray-400">
                            Get notified when streams go offline or recover.
                        </p>
                    </div>
                </div>
                <HelpIcon articleId="stream-alerts" tooltip="Configure email alerts for stream outages" />
            </div>

            {/* SMTP Warning */}
            {!initialSettings.hasSmtpConfigured && (
                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-yellow-300 font-medium">Email not configured</p>
                        <p className="text-xs text-yellow-400/70 mt-1">
                            Configure SMTP settings above before adding alert recipients.
                        </p>
                    </div>
                </div>
            )}

            {/* Alert Recipients Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-300">Alert Recipients</h3>
                    {emails.length > 0 && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                            {emails.length} {emails.length === 1 ? 'recipient' : 'recipients'}
                        </span>
                    )}
                </div>

                {/* Email List */}
                {emails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {emails.map((email) => (
                            <div
                                key={email}
                                className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 group"
                            >
                                <span className="text-sm text-gray-200">{email}</span>
                                <button
                                    onClick={() => handleRemoveEmail(email)}
                                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Email Input */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => {
                                setNewEmail(e.target.value);
                                setEmailError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Add email address..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        {emailError && (
                            <p className="text-xs text-red-400 mt-1">{emailError}</p>
                        )}
                    </div>
                    <button
                        onClick={handleAddEmail}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>

                {/* Info about who gets notified */}
                {emails.length > 1 && (
                    <p className="text-xs text-gray-500">
                        💡 Alert emails will show all recipients so your team knows who else was notified.
                    </p>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 my-6" />

            {/* Alert Preferences */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Alert Preferences</h3>

                {/* Stream Scope Toggle */}
                <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-200 text-sm">Monitor all streams</p>
                        <p className="text-xs text-gray-500">
                            {alertAllStreams
                                ? 'Alerts for any enabled stream going offline'
                                : 'Alerts only when the primary (default) stream goes offline'}
                        </p>
                    </div>
                    <Switch checked={alertAllStreams} onChange={setAlertAllStreams} />
                </div>

                {/* Recovery Notifications Toggle */}
                <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-200 text-sm">Recovery notifications</p>
                        <p className="text-xs text-gray-500">
                            Send email when a stream comes back online
                        </p>
                    </div>
                    <Switch checked={alertOnRecovery} onChange={setAlertOnRecovery} />
                </div>

                {/* Cooldown Setting */}
                <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="font-medium text-gray-200 text-sm">Alert cooldown</p>
                            <p className="text-xs text-gray-500">
                                Minimum time between alerts for the same stream
                            </p>
                        </div>
                    </div>
                    <select
                        value={alertCooldownMins}
                        onChange={(e) => setAlertCooldownMins(parseInt(e.target.value))}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {COOLDOWN_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-800 my-6" />

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving || !initialSettings.hasSmtpConfigured}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${saved
                            ? 'bg-green-600 text-white'
                            : hasChanges
                                ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse'
                                : 'border border-gray-700 hover:border-gray-600 bg-transparent hover:bg-gray-800 text-white'
                        } ${!initialSettings.hasSmtpConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved
                        </>
                    ) : isSaving ? (
                        'Saving...'
                    ) : hasChanges ? (
                        'Save Alert Settings *'
                    ) : (
                        'Save Alert Settings'
                    )}
                </button>
            </div>
        </div>
    );
}

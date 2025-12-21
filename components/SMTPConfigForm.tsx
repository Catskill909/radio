'use client';

import { useState } from 'react';
import { updateSmtpSettings, testSmtpConnection } from '@/app/actions';
import { Check, Mail, Eye, EyeOff, AlertCircle, Send, Server } from 'lucide-react';
import Switch from './Switch';
import HelpIcon from './HelpIcon';

interface SMTPConfigFormProps {
    initialSettings: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        hasPassword: boolean;
        smtpFromName: string;
        smtpUseTls: boolean;
    };
}

// Common SMTP port options
const PORT_OPTIONS = [
    { value: 587, label: '587 (STARTTLS - Recommended)' },
    { value: 465, label: '465 (SSL/TLS)' },
    { value: 25, label: '25 (Unencrypted - Not recommended)' },
    { value: 2525, label: '2525 (Alternative)' },
];

export default function SMTPConfigForm({ initialSettings }: SMTPConfigFormProps) {
    // Form state - default to smtp.gmail.com if no host configured
    const [smtpHost, setSmtpHost] = useState(initialSettings.smtpHost || 'smtp.gmail.com');
    const [smtpPort, setSmtpPort] = useState(initialSettings.smtpPort);
    const [smtpUser, setSmtpUser] = useState(initialSettings.smtpUser);
    const [smtpPassword, setSmtpPassword] = useState('');
    const [smtpFromName, setSmtpFromName] = useState(initialSettings.smtpFromName);
    const [smtpUseTls, setSmtpUseTls] = useState(initialSettings.smtpUseTls);

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [hasExistingPassword, setHasExistingPassword] = useState(initialSettings.hasPassword);

    // Test email state
    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Save state
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track unsaved changes
    const hasChanges =
        smtpHost !== initialSettings.smtpHost ||
        smtpPort !== initialSettings.smtpPort ||
        smtpUser !== initialSettings.smtpUser ||
        smtpPassword !== '' ||
        smtpFromName !== initialSettings.smtpFromName ||
        smtpUseTls !== initialSettings.smtpUseTls;

    // Check if config is complete enough for testing
    const isConfigComplete = smtpHost && smtpUser && (hasExistingPassword || smtpPassword);

    // Handle save
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Strip spaces from password (Gmail App Passwords have spaces when copied)
            // Pass null for password to keep existing, empty string to clear, or new value to update
            const cleanPassword = smtpPassword ? smtpPassword.replace(/\s/g, '') : smtpPassword;
            const passwordValue = cleanPassword === '' ? null : cleanPassword;

            await updateSmtpSettings(
                smtpHost,
                smtpPort,
                smtpUser,
                passwordValue,
                smtpFromName,
                smtpUseTls
            );

            // If we saved a new password, mark that we have one
            if (smtpPassword) {
                setHasExistingPassword(true);
                setSmtpPassword(''); // Clear the password field after save
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle test email
    const handleTestEmail = async () => {
        if (!testEmail) {
            setTestResult({ success: false, message: 'Please enter a test email address' });
            return;
        }

        // Save any pending changes first
        if (hasChanges) {
            await handleSave();
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testSmtpConnection(testEmail);
            setTestResult({
                success: result.success,
                message: result.success
                    ? 'Test email sent successfully! Check your inbox.'
                    : result.error || 'Failed to send test email'
            });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || 'Failed to send test email'
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-blue-400" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">Email Configuration</h2>
                        <p className="text-sm text-gray-400">
                            Configure SMTP server for sending alert emails.
                        </p>
                    </div>
                </div>
                <HelpIcon articleId="email-configuration" tooltip="Set up email notifications for stream alerts" />
            </div>

            {/* SMTP Server Settings */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">SMTP Server</h3>

                {/* Host + Port (2-column grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Host */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            SMTP Host
                        </label>
                        <div className="relative">
                            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={smtpHost}
                                onChange={(e) => setSmtpHost(e.target.value)}
                                placeholder="mail.yourdomain.com"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Port Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            Port
                        </label>
                        <select
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {PORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        Username / Email
                    </label>
                    <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="alerts@yourdomain.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        Password {hasExistingPassword && <span className="text-green-400 text-xs ml-2">● Saved</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            placeholder={hasExistingPassword ? '••••••••••••••••' : 'Enter SMTP password'}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-12 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {hasExistingPassword && (
                        <p className="text-xs text-gray-500 mt-1">
                            Leave blank to keep existing password, or enter a new one to update.
                        </p>
                    )}
                </div>

                {/* From Name + TLS toggle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            From Name
                        </label>
                        <input
                            type="text"
                            value={smtpFromName}
                            onChange={(e) => setSmtpFromName(e.target.value)}
                            placeholder="StationDock Alerts"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium text-gray-200 text-sm">Use TLS/STARTTLS</p>
                            <p className="text-xs text-gray-500">Secure connection (recommended)</p>
                        </div>
                        <Switch checked={smtpUseTls} onChange={setSmtpUseTls} />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 my-6" />

            {/* Test Email Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Test Configuration</h3>

                <div className="flex flex-wrap items-end gap-3">
                    {/* Test Email Input */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            Send Test Email To
                        </label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Send Test Button */}
                    <button
                        onClick={handleTestEmail}
                        disabled={!isConfigComplete || isTesting || !testEmail}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        {isTesting ? 'Sending...' : 'Send Test Email'}
                    </button>
                </div>

                {/* Test Result */}
                {testResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${testResult.success
                        ? 'bg-green-900/20 border border-green-800/30'
                        : 'bg-red-900/20 border border-red-800/30'
                        }`}>
                        {testResult.success ? (
                            <Check className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <p className={`text-sm ${testResult.success ? 'text-green-300' : 'text-red-300'}`}>
                            {testResult.message}
                        </p>
                    </div>
                )}

                {!isConfigComplete && (
                    <p className="text-xs text-gray-500">
                        Complete the SMTP configuration above and save to enable testing.
                    </p>
                )}
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
                    disabled={isSaving}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${saved
                        ? 'bg-green-600 text-white'
                        : hasChanges
                            ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                            : 'border border-gray-700 hover:border-gray-600 bg-transparent hover:bg-gray-800 text-white'
                        }`}
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved
                        </>
                    ) : isSaving ? (
                        'Saving...'
                    ) : hasChanges ? (
                        'Save SMTP Settings *'
                    ) : (
                        'Save SMTP Settings'
                    )}
                </button>
            </div>
        </div>
    );
}

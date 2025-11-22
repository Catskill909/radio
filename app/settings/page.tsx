export default function SettingsPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-4xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Settings</h1>
                <p className="text-gray-400 mt-2">Application settings will appear here.</p>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg">
                Settings panel placeholder
            </div>
        </div>
    );
}

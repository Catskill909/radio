'use client'

interface MeterToggleProps {
    value: 'peak' | 'vu' | 'none'
    onChange: (value: 'peak' | 'vu' | 'none') => void
}

export default function MeterToggle({ value, onChange }: MeterToggleProps) {
    const options = [
        { value: 'peak' as const, label: 'Peak' },
        { value: 'vu' as const, label: 'VU' },
        { value: 'none' as const, label: 'None' },
    ]

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Meters:</span>
            <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-0.5">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${value === option.value
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

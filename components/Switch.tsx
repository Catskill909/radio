'use client';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

export default function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
    return (
        <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />
                {/* Track */}
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-[#626ac4]' : 'bg-gray-700'
                    }`}></div>
                {/* Thumb */}
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
            </div>
        </label>
    );
}

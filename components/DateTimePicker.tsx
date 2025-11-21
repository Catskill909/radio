'use client'

import { forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Clock } from 'lucide-react'

interface DateTimePickerProps {
    selected: Date | null
    onChange: (date: Date | null) => void
    showTimeSelect?: boolean
    timeOnly?: boolean
    label: string
    required?: boolean
    minDate?: Date
}

// Custom input component
const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, label, icon: Icon }, ref) => (
    <button
        type="button"
        onClick={onClick}
        ref={ref}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left flex items-center gap-3 hover:border-gray-600"
    >
        <Icon className="w-5 h-5 text-gray-400" />
        <span className={value ? 'text-white' : 'text-gray-500'}>
            {value || `Select ${label.toLowerCase()}`}
        </span>
    </button>
))

CustomInput.displayName = 'CustomInput'

export default function DateTimePicker({
    selected,
    onChange,
    showTimeSelect = false,
    timeOnly = false,
    label,
    required = false,
    minDate,
}: DateTimePickerProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <DatePicker
                selected={selected}
                onChange={onChange}
                showTimeSelect={showTimeSelect}
                showTimeSelectOnly={timeOnly}
                timeIntervals={15}
                timeCaption="Time"
                dateFormat={timeOnly ? 'h:mm aa' : showTimeSelect ? 'MMMM d, yyyy h:mm aa' : 'MMMM d, yyyy'}
                minDate={minDate}
                customInput={
                    <CustomInput
                        label={label}
                        icon={timeOnly ? Clock : Calendar}
                    />
                }
                calendarClassName="dark-calendar"
                wrapperClassName="w-full"
                popperClassName="dark-popper"
            />
        </div>
    )
}

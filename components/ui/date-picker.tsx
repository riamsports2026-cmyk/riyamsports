'use client';

import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerInputProps {
  value?: string;
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
}

// Custom input component to style the date picker
const CustomInput = forwardRef<HTMLInputElement, {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}>(({ value, onClick, placeholder, className, required }, ref) => (
  <input
    ref={ref}
    type="text"
    value={value}
    onClick={onClick}
    readOnly
    placeholder={placeholder}
    required={required}
    className={className}
    style={{ height: className?.includes('h-[') ? undefined : '42px' }}
  />
));

CustomInput.displayName = 'CustomInput';

export function DatePickerInput({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  className = 'w-full px-4 py-3.5 text-base border-2 border-[#FF6B35]/40 rounded-xl shadow-md focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-semibold text-[#1E3A5F] cursor-pointer',
  required = false,
  id,
  name,
}: DatePickerInputProps) {
  const selectedDate = value ? (() => {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  })() : null;

  const handleDateChange = (date: Date | null) => {
    if (date && !isNaN(date.getTime())) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
  };

  return (
    <div className="react-datepicker-wrapper w-full relative">
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        minDate={minDate}
        maxDate={maxDate}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        customInput={
          <CustomInput
            className={className}
            required={required}
          />
        }
        wrapperClassName="w-full"
        calendarClassName="!border-2 !border-[#FF6B35] !rounded-xl !shadow-xl"
        popperClassName="!z-9999"
        dayClassName={(date) => {
          const day = date.getDay();
          return day === 0 || day === 6
            ? '!text-gray-400'
            : '!text-[#1E3A5F] hover:!bg-[#FF6B35]/10';
        }}
        className="w-full"
        popperPlacement="bottom-start"
      />
      {name && <input type="hidden" name={name} id={id} value={value || ''} />}
    </div>
  );
}


'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className = 'w-full px-4 py-3.5 text-base border-2 border-[#FF6B35]/40 rounded-xl shadow-md focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-semibold text-[#1E3A5F] cursor-pointer',
  required = false,
  id,
  name,
  min,
  max,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        if (hours === 0) {
          setSelectedHour(12);
          setPeriod('AM');
        } else if (hours === 12) {
          setSelectedHour(12);
          setPeriod('PM');
        } else if (hours > 12) {
          setSelectedHour(hours - 12);
          setPeriod('PM');
        } else {
          setSelectedHour(hours);
          setPeriod('AM');
        }
        setSelectedMinute(minutes);
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTime = (hour: number | null, minute: number | null, period: 'AM' | 'PM'): string => {
    if (hour === null || minute === null) return '';
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    else if (period === 'AM' && hour === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const isHourDisabled = (h12: number): boolean => {
    if (!min && !max) return false;
    const amStart = h12 === 12 ? '00:00' : `${String(h12).padStart(2, '0')}:00`;
    const amEnd = h12 === 12 ? '00:59' : `${String(h12).padStart(2, '0')}:59`;
    const pmStart = h12 === 12 ? '12:00' : `${String(h12 + 12).padStart(2, '0')}:00`;
    const pmEnd = h12 === 12 ? '12:59' : `${String(h12 + 12).padStart(2, '0')}:59`;
    const amOk = (!min || amEnd >= min) && (!max || amStart <= max);
    const pmOk = (!min || pmEnd >= min) && (!max || pmStart <= max);
    return !amOk && !pmOk;
  };

  const isMinuteDisabled = (minute: number): boolean => {
    if (!min && !max) return false;
    const h = selectedHour;
    if (h === null) return false;
    const t = formatTime(h, minute, period);
    if (min && t < min) return true;
    if (max && t > max) return true;
    return false;
  };

  const handleTimeSelect = (hour: number | null, minute: number | null) => {
    if (hour !== null && isHourDisabled(hour)) return;
    if (minute !== null && isMinuteDisabled(minute)) return;
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (hour !== null && minute !== null) {
      const timeString = formatTime(hour, minute, period);
      if (min && timeString < min) return;
      if (max && timeString > max) return;
      onChange(timeString);
      setIsOpen(false);
    }
  };

  const displayValue = value
    ? (() => {
        const [hours, minutes] = value.split(':').map(Number);
        let hour12 = hours;
        let period = 'AM';
        if (hours === 0) {
          hour12 = 12;
        } else if (hours === 12) {
          period = 'PM';
        } else if (hours > 12) {
          hour12 = hours - 12;
          period = 'PM';
        }
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      })()
    : placeholder;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={displayValue}
        onClick={() => setIsOpen(!isOpen)}
        readOnly
        placeholder={placeholder}
        required={required}
        className={className}
        style={{ height: className?.includes('h-[') ? undefined : '42px' }}
      />
      {name && <input type="hidden" name={name} id={id} value={value || ''} />}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border-2 border-[#FF6B35] p-4 w-full max-w-xs">
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {/* Hours */}
            <div>
              <div className="text-xs font-bold text-[#1E3A5F] mb-2 text-center">Hour</div>
              <div className="space-y-1">
                {hours.map((hour) => {
                  const disabled = isHourDisabled(hour);
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => !disabled && handleTimeSelect(hour, selectedMinute)}
                      disabled={disabled}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        disabled
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : selectedHour === hour
                            ? 'bg-[#FF6B35] text-white cursor-pointer'
                            : 'bg-gray-100 text-[#1E3A5F] hover:bg-[#FF6B35]/20 cursor-pointer'
                      }`}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <div className="text-xs font-bold text-[#1E3A5F] mb-2 text-center">Minute</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {minutes.map((minute) => {
                  const disabled = isMinuteDisabled(minute);
                  return (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => !disabled && handleTimeSelect(selectedHour, minute)}
                      disabled={disabled}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                        disabled
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : selectedMinute === minute
                            ? 'bg-[#FF6B35] text-white cursor-pointer'
                            : 'bg-gray-100 text-[#1E3A5F] hover:bg-[#FF6B35]/20 cursor-pointer'
                      }`}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AM/PM */}
            <div>
              <div className="text-xs font-bold text-[#1E3A5F] mb-2 text-center">Period</div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('AM');
                    if (selectedHour !== null && selectedMinute !== null) {
                      const t = formatTime(selectedHour, selectedMinute, 'AM');
                      if ((!min || t >= min) && (!max || t <= max)) onChange(t);
                    }
                  }}
                  className={`w-full py-3 px-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    period === 'AM'
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-gray-100 text-[#1E3A5F] hover:bg-[#FF6B35]/20'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('PM');
                    if (selectedHour !== null && selectedMinute !== null) {
                      const t = formatTime(selectedHour, selectedMinute, 'PM');
                      if ((!min || t >= min) && (!max || t <= max)) onChange(t);
                    }
                  }}
                  className={`w-full py-3 px-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    period === 'PM'
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-gray-100 text-[#1E3A5F] hover:bg-[#FF6B35]/20'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


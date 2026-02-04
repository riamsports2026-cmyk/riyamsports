'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  required = false,
  id,
  name,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (optionValue: string) => {
    if (!options.find((opt) => opt.value === optionValue)?.disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} id={id} value={value || ''} required={required} />}
      
      {/* Custom Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left bg-white border-2 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-between ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-[#FF6B35] shadow-lg ring-4 ring-[#FF6B35]/20'
            : 'border-[#1E3A5F]/20 text-[#1E3A5F] hover:border-[#FF6B35]/40 hover:shadow-md cursor-pointer'
        } ${!selectedOption ? 'text-gray-500' : 'font-medium'}`}
      >
        <span className="truncate">{displayValue}</span>
        <svg
          className={`w-5 h-5 text-[#FF6B35] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-[#FF6B35] rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = value === option.value;
              const isDisabled = option.disabled;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={isDisabled}
                  className={`w-full px-4 py-3.5 text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white font-bold'
                      : isDisabled
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                      : 'text-[#1E3A5F] hover:bg-linear-to-r hover:from-[#FF6B35]/10 hover:to-[#FF8C61]/10 hover:font-semibold hover:border-l-4 hover:border-[#FF6B35]'
                  } ${!isSelected && !isDisabled ? 'hover:pl-5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}




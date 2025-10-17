import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    required?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selected, onChange, placeholder = "Select...", required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOptions = selected
        .map(val => options.find(opt => opt.value === val))
        .filter((opt): opt is Option => !!opt);
        
    const availableOptions = options.filter(opt => !selected.includes(opt.value));

    const handleRemoveOption = (e: React.MouseEvent, value: string) => {
        e.stopPropagation();
        onChange(selected.filter(s => s !== value));
    };

    const handleSelectOption = (value: string) => {
        if (!selected.includes(value)) {
            onChange([...selected, value]);
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">{label}{required && <span className="text-red-400">*</span>}</label>
            <div ref={wrapperRef} className="relative">
                <div 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="relative flex flex-wrap gap-2 p-2 min-h-[44px] items-center bg-zinc-800 border border-zinc-700 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
                >
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(option => (
                            <span key={option.value} className="flex items-center gap-1 bg-indigo-600 text-white text-sm font-medium px-2.5 py-1 rounded-full z-10">
                                {option.label}
                                <button type="button" onClick={(e) => handleRemoveOption(e, option.value)} className="hover:bg-indigo-500 rounded-full p-0.5 -mr-1">
                                    <X size={14} />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-zinc-500 px-1">{placeholder}</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                         <ChevronDown size={20} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {isOpen && (
                    <ul className="absolute z-20 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {availableOptions.length > 0 ? (
                            availableOptions.map(option => (
                                <li 
                                    key={option.value} 
                                    onClick={() => handleSelectOption(option.value)}
                                    className="px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                                >
                                    {option.label}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-sm text-zinc-500 italic">No more options</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default MultiSelectDropdown;

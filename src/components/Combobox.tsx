"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: { value: string; label: string; subLabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCreate?: (value: string) => void;
}

export default function Combobox({ options, value, onChange, placeholder = "Select...", onCreate }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on query
  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setQuery(""); // Reset query? Or keep it? keeping it empty is safer.
    setOpen(false);
  };

  const handleCreate = () => {
    if (onCreate) {
        onCreate(query);
        setQuery("");
        setOpen(false);
    }
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="flex items-center justify-between w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
        onClick={() => setOpen(!open)}
      >
        <input
            type="text"
            className="bg-transparent border-none outline-none w-full text-sm cursor-pointer"
            placeholder={placeholder}
            value={open ? query : (selectedOption ? selectedOption.label : value)}
            onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
            onFocus={() => setOpen(true)}
        />
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 && query !== "" && (
             <div 
                className="px-3 py-2 text-sm text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                onClick={handleCreate}
             >
                <Plus size={14} /> Create "{query}"
             </div>
          )}
          
          {filteredOptions.length === 0 && query === "" && (
             <div className="px-3 py-2 text-sm text-zinc-500">No options found.</div>
          )}

          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800",
                value === option.value ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : ""
              )}
              onClick={() => handleSelect(option.value)}
            >
              <div>
                <div>{option.label}</div>
                {option.subLabel && <div className="text-xs text-zinc-500">{option.subLabel}</div>}
              </div>
              {value === option.value && <Check className="h-4 w-4 opacity-50" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

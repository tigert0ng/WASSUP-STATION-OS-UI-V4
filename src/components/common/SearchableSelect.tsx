import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  group?: string;
}

export interface SearchableSelectProps {
  options: SelectOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}

// Utility function to normalize Vietnamese text for diacritic-insensitive search
function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "-- Chọn giá trị --",
  searchPlaceholder = "Gõ để tìm kiếm nhanh...",
  className = "",
  disabled = false,
  required = false,
  clearable = false,
  id,
  name,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options array to standard SelectOption format
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find selected option object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filtered options based on search query (quick suggest)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const queryNormalized = removeAccents(searchQuery.toLowerCase().trim());
    return normalizedOptions.filter((opt) => {
      const labelNormalized = removeAccents(opt.label.toLowerCase());
      const valueNormalized = removeAccents(opt.value.toLowerCase());
      const sublabelNormalized = opt.sublabel ? removeAccents(opt.sublabel.toLowerCase()) : "";
      return (
        labelNormalized.includes(queryNormalized) ||
        valueNormalized.includes(queryNormalized) ||
        sublabelNormalized.includes(queryNormalized)
      );
    });
  }, [normalizedOptions, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
      inputRef.current?.blur();
    } else if (e.key === "Enter" && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0].value);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Size specific styles for input
  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs rounded-lg pr-8",
    md: "px-3.5 py-2.5 text-xs rounded-xl pr-9",
    lg: "px-4 py-3 text-sm rounded-xl pr-10",
  }[size];

  // Display value for the input field
  const displayInputValue = isOpen
    ? searchQuery
    : selectedOption
    ? selectedOption.label
    : "";

  const displayPlaceholder = isOpen
    ? selectedOption
      ? selectedOption.label
      : searchPlaceholder
    : placeholder;

  return (
    <div ref={containerRef} className="relative w-full text-left font-sans" onKeyDown={handleKeyDown}>
      {/* Hidden input for HTML form validation compatibility */}
      {required && (
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Direct Editable Input Field at Dropdown Location */}
      <div className="relative w-full flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayInputValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
            }
          }}
          placeholder={displayPlaceholder}
          className={`w-full bg-stone-50 border border-stone-200 hover:border-slate-400 focus:border-purple-600 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none ${sizeClasses} ${
            disabled ? "opacity-50 cursor-not-allowed bg-stone-100" : "cursor-text"
          } ${isOpen ? "ring-2 ring-purple-500/20 border-purple-500 bg-white" : ""} ${className}`}
        />

        {/* Right Controls (Clear & Chevron) */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
          {clearable && (selectedOption || searchQuery) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-700 hover:bg-stone-200 rounded transition cursor-pointer pointer-events-auto"
              title="Xóa lựa chọn"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                if (!isOpen) inputRef.current?.focus();
              }
            }}
            className={`h-4 w-4 transition-transform duration-200 cursor-pointer pointer-events-auto ${
              isOpen ? "rotate-180 text-purple-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Options List Popover (No Search Box Inside) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn max-h-60 flex flex-col">
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 text-purple-900 font-bold"
                        : "text-slate-700 hover:bg-stone-100 hover:text-slate-900"
                    } ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex flex-col truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && <span className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</span>}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium italic">
                Không tìm thấy kết quả phù hợp "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

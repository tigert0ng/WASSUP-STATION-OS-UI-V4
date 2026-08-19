import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X, Check } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "md";
}

// Diacritic-insensitive normalization for Vietnamese search (NFD strips tone
// marks; "đ"/"Đ" don't decompose under NFD so they need an explicit swap).
function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

const sizeClasses: Record<NonNullable<SearchableSelectProps["size"]>, string> = {
  sm: "px-2.5 py-1.5 text-[11px] rounded-lg pr-8",
  md: "px-3.5 py-2.5 text-xs rounded-xl pr-9",
};

/**
 * Searchable/filterable single-select combobox — replaces plain `<select>`
 * elements where the option list is long enough to benefit from typing to
 * filter (supplier picker, item picker, reason picker, related-tool picker).
 *
 * Styled to this project's real design tokens (forest-green / matte-black /
 * mid-gray / brand-green, the `bg-white border border-[#e5e5e5] rounded-xl`
 * input convention) — not the purple/slate scheme of the AI-Studio UI
 * reference this was ported from.
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "-- Chọn --",
  searchPlaceholder = "Gõ để tìm kiếm...",
  emptyMessage,
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

  const normalizedOptions: SearchableSelectOption[] = useMemo(() => {
    return options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  }, [options]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((opt) => String(opt.value) === String(value)),
    [normalizedOptions, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const queryNormalized = removeAccents(searchQuery.toLowerCase().trim());
    return normalizedOptions.filter((opt) => {
      const labelNormalized = removeAccents(opt.label.toLowerCase());
      const sublabelNormalized = opt.sublabel ? removeAccents(opt.sublabel.toLowerCase()) : "";
      return labelNormalized.includes(queryNormalized) || sublabelNormalized.includes(queryNormalized);
    });
  }, [normalizedOptions, searchQuery]);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
      inputRef.current?.blur();
    } else if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      const firstEnabled = filteredOptions.find((opt) => !opt.disabled);
      if (firstEnabled) handleSelect(firstEnabled.value);
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  const displayInputValue = isOpen ? searchQuery : selectedOption ? selectedOption.label : "";
  const displayPlaceholder = isOpen ? selectedOption ? selectedOption.label : searchPlaceholder : placeholder;

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <div className="relative w-full flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          required={required}
          value={displayInputValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onClick={() => {
            if (!disabled && !isOpen) setIsOpen(true);
          }}
          placeholder={displayPlaceholder}
          className={`w-full bg-white border border-[#e5e5e5] focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors ${sizeClasses[size]} ${
            isOpen ? "border-forest-green" : ""
          } ${className}`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-mid-gray">
          {clearable && !!selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-matte-black hover:bg-gray-100 rounded transition cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            onClick={() => {
              if (disabled) return;
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className={`h-3.5 w-3.5 transition-transform duration-150 cursor-pointer ${isOpen ? "rotate-180 text-forest-green" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[70] bg-white border border-[#e5e5e5] rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected ? "bg-brand-green-light text-matte-black font-extrabold" : "text-matte-black hover:bg-warm-white"
                    }`}
                  >
                    <span className="flex flex-col truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && <span className="text-[10px] text-mid-gray font-normal">{opt.sublabel}</span>}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-forest-green shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-mid-gray font-medium italic">
                {emptyMessage ?? `Không tìm thấy kết quả phù hợp "${searchQuery}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

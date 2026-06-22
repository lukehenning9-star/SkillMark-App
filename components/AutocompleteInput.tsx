"use client";

import { useState, useRef, useEffect } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder = "Type to search…",
  className,
  autoFocus,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  function select(s: string) {
    onChange(s);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        select(filtered[activeIdx]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                select(s);
              }}
              className={`w-full text-left text-sm px-3 py-2 transition-colors ${
                i === activeIdx
                  ? "bg-accent/10 text-navy font-medium"
                  : "text-navy hover:bg-sm-bg"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

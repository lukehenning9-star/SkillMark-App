"use client";

import { useState, useRef, useEffect } from "react";

interface SkillTagInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  suggestions: readonly string[];
  placeholder?: string;
}

export default function SkillTagInput({
  value,
  onChange,
  suggestions,
  placeholder = "Type a skill and press Enter…",
}: SkillTagInputProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) =>
      s !== "Other" &&
      s.toLowerCase().includes(input.toLowerCase()) &&
      !value.includes(s)
  );

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
    setOpen(false);
    setActiveIdx(-1);
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        addSkill(filtered[activeIdx]);
      } else if (input.trim()) {
        addSkill(input);
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
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
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

  const showCustomOption =
    input.trim() &&
    !suggestions.some((s) => s.toLowerCase() === input.trim().toLowerCase()) &&
    !value.includes(input.trim());

  return (
    <div ref={containerRef} className="relative">
      <div
        className="min-h-[42px] w-full bg-sm-bg border border-border rounded-md px-3 py-2 flex flex-wrap gap-1.5 cursor-text focus-within:border-accent focus-within:bg-white transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-navy text-white font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(skill);
              }}
              className="text-white/60 hover:text-white leading-none ml-0.5"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-navy placeholder:text-text-dim outline-none py-0.5"
        />
      </div>

      {open && (filtered.length > 0 || showCustomOption) && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addSkill(s);
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
          {showCustomOption && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addSkill(input);
              }}
              className="w-full text-left text-sm px-3 py-2 text-accent font-medium hover:bg-sm-bg transition-colors border-t border-border"
            >
              Add &quot;{input.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

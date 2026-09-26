"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type FilterSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type MenuCoords = {
  top: number;
  left: number;
  width: number;
};

export function FilterSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T | null;
  options: FilterSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? "Select";
  const showMenu = open && !disabled;

  useLayoutEffect(() => {
    if (!showMenu) {
      setCoords(null);
      return;
    }

    function updatePosition() {
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showMenu, options.length, selectedLabel]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        boxRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const menu =
    showMenu && coords
      ? createPortal(
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={id}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              zIndex: 80,
            }}
            className="max-h-60 overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <li key={String(option.value)} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex min-h-11 w-full cursor-pointer items-center px-3 text-left text-sm transition-colors duration-200 ${
                      active
                        ? "bg-primary-soft font-medium text-primary"
                        : "text-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={showMenu}
        aria-controls={`${id}-list`}
        aria-label={label}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        className="inline-flex h-11 min-w-44 cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 text-sm text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
            showMenu ? "rotate-180" : ""
          }`}
        />
      </button>
      {menu}
    </div>
  );
}

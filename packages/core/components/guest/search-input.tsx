"use client";

// =============================================================================
// Search input — debounced combobox with keyboard navigation
// =============================================================================
// Per task.md:
//   - 200ms debounce after the user stops typing
//   - Min 2 chars to fire a search
//   - Keyboard: ↑/↓ navigate results, Enter selects, Esc clears
//   - ARIA: role="combobox", aria-expanded, aria-activedescendant,
//     aria-live="polite" for result count announcement

import { useState, useEffect, useRef, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { Guest } from "@gps/shared";
import { Avatar } from "./avatar";
import { PhaseBadge } from "./phase-badge";
import { clsx } from "clsx";

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

export interface SearchInputProps {
  onSelect: (guest: Guest) => void;
  className?: string;
}

export function SearchInput({ onSelect, className }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Debounced search.
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setError(null);
      setIsExpanded(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const guests = await api.searchGuests(q);
      // Ignore stale responses (a newer request came in while this one was in flight).
      if (requestId === requestIdRef.current) {
        setResults(guests);
        setHighlightedIndex(guests.length > 0 ? 0 : -1);
        setIsExpanded(true);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof ApiError ? err.message : "Search failed.");
        setResults([]);
        setHighlightedIndex(-1);
        setIsExpanded(false);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Input change handler with debounce.
  function handleChange(value: string) {
    setQuery(value);
    setHighlightedIndex(-1);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSearch(value);
    }, DEBOUNCE_MS);
  }

  // Keyboard navigation.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        const guest = results[highlightedIndex];
        if (guest) {
          onSelect(guest);
          setIsExpanded(false);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setResults([]);
      setHighlightedIndex(-1);
      setIsExpanded(false);
      inputRef.current?.focus();
    }
  }

  function handleResultClick(guest: Guest) {
    onSelect(guest);
    setIsExpanded(false);
  }

  // Cleanup debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Determine ARIA activedescendant.
  const activeDescendantId =
    highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined;

  return (
    <div className={clsx("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search by name, email, or phone..."
        role="combobox"
        aria-expanded={isExpanded}
        aria-controls="search-results-listbox"
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        className="w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        autoComplete="off"
      />

      {/* aria-live announces result count to screen readers */}
      <div aria-live="polite" className="sr-only">
        {loading
          ? "Searching..."
          : results.length > 0
            ? `${results.length} ${results.length === 1 ? "result" : "results"} found`
            : query.trim().length >= MIN_QUERY_LENGTH && !error
              ? "No results found"
              : ""}
      </div>

      {/* Results list */}
      {isExpanded && (
        <ul
          id="search-results-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-lg border border-ink-200 bg-white shadow-raised max-h-96 overflow-y-auto"
        >
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  role="presentation"
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-48" />
                  </div>
                </li>
              ))}
            </>
          )}

          {!loading && error && (
            <li
              role="status"
              className="px-4 py-3 text-sm text-danger"
            >
              {error}
            </li>
          )}

          {!loading && !error && results.length === 0 && (
            <li
              role="status"
              className="px-4 py-3 text-sm text-ink-500"
            >
              No guests found. Try a different search term.
            </li>
          )}

          {!loading && !error && results.map((guest, i) => (
            <li
              key={guest.guestId}
              id={`search-result-${i}`}
              role="option"
              aria-selected={i === highlightedIndex}
              onClick={() => handleResultClick(guest)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-ink-100 last:border-b-0",
                i === highlightedIndex ? "bg-surface" : "hover:bg-ink-50",
              )}
            >
              <Avatar
                firstName={guest.firstName}
                lastName={guest.lastName}
                seed={guest.guestId}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900 truncate">
                    {guest.firstName ?? ""} {guest.lastName ?? ""}
                  </span>
                  <PhaseBadge phase={guest.guestPhase} />
                </div>
                <div className="text-sm text-ink-500 truncate">
                  {guest.email ?? "—"}
                  {guest.phone ? ` · ${guest.phone}` : ""}
                </div>
              </div>
              {guest.lastStayDate && (
                <div className="text-xs text-ink-400 whitespace-nowrap">
                  Last stay: {guest.lastStayDate.toISOString().slice(0, 10)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Hint text below the input */}
      {query.trim().length < MIN_QUERY_LENGTH && !loading && results.length === 0 && (
        <p className="mt-2 text-sm text-ink-400">
          Start typing to search guests (at least 2 characters).
        </p>
      )}
    </div>
  );
}

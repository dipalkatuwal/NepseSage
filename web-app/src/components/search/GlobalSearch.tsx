"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, LineChart, LayoutDashboard, Settings, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSymbolSearch } from "@/hooks/useNepse";

const SHORTCUTS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Market Overview", icon: LineChart, href: "/market" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface GlobalSearchProps {
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export function GlobalSearch({ isExpanded: controlledExpanded, onExpandChange }: GlobalSearchProps) {
  const router = useRouter();
  const { results, searching, search } = useSymbolSearch();
  const [openSearch, setOpenSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [internalExpanded, setInternalExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearchExpanded = controlledExpanded ?? internalExpanded;
  const setIsSearchExpanded = (val: boolean) => {
    setInternalExpanded(val);
    onExpandChange?.(val);
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpenSearch(false);
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (symbol: string) => {
    setOpenSearch(false);
    setIsSearchExpanded(false);
    setQuery("");
    router.push(`/companyDetails/${symbol}`);
  };

  const handleShortcut = (href: string) => {
    setOpenSearch(false);
    setIsSearchExpanded(false);
    setQuery("");
    router.push(href);
  };

  const showResults = query.trim().length > 0;

  return (
    <div className={`relative flex items-center ${isSearchExpanded ? "flex-1" : ""}`}>
      <Popover open={openSearch} onOpenChange={(o) => { setOpenSearch(o); if (!o) setQuery(""); }}>
        <PopoverTrigger asChild>
          <div className={`group relative flex items-center ${isSearchExpanded ? "w-full" : ""}`}>
            <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary ${isSearchExpanded ? "z-10 block" : "hidden md:block"}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpenSearch(true); }}
              placeholder="Search symbols… (⌘K)"
              className={`h-8 rounded-md border border-border bg-input pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 ${
                isSearchExpanded
                  ? "w-full focus:ring-2"
                  : "w-0 md:w-72 focus:w-40 md:focus:w-72 opacity-0 md:opacity-100"
              }`}
              onFocus={() => {
                setOpenSearch(true);
                if (window.innerWidth < 768) setIsSearchExpanded(true);
              }}
            />
            {/* Mobile search icon */}
            {!isSearchExpanded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden absolute left-0"
                onClick={() => { setIsSearchExpanded(true); setTimeout(() => inputRef.current?.focus(), 50); }}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            {/* Clear button when typing */}
            {query && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hidden md:block"
                onClick={() => { setQuery(""); search(""); inputRef.current?.focus(); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className={`${isSearchExpanded ? "w-[calc(100vw-2rem)]" : "w-80"} p-0 overflow-hidden`}
          align={isSearchExpanded ? "center" : "start"}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Results when typing */}
          {showResults ? (
            <div>
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No results for "<span className="font-medium text-foreground">{query}</span>"
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Stocks · {results.length} result{results.length !== 1 ? "s" : ""}
                  </p>
                  {results.slice(0, 10).map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock.symbol)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/60 transition text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                          <LineChart className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-none">{stock.symbol}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{stock.companyName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs font-medium">NPR {stock.ltp.toFixed(2)}</p>
                        <p className={`text-xs flex items-center justify-end gap-0.5 ${stock.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {stock.change >= 0
                            ? <TrendingUp className="h-3 w-3" />
                            : <TrendingDown className="h-3 w-3" />}
                          {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Default state — shortcuts */
            <div className="p-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Quick Navigation
              </p>
              {SHORTCUTS.map(({ label, icon: Icon, href }) => (
                <button
                  key={href}
                  onClick={() => handleShortcut(href)}
                  className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-secondary/60 transition text-left"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </button>
              ))}
              <p className="px-3 pt-3 pb-1 text-[10px] text-muted-foreground">
                Type a symbol or company name to search all NEPSE listings
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Mobile close button */}
      {isSearchExpanded && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-8 w-8 shrink-0 md:hidden"
          onClick={() => { setIsSearchExpanded(false); setQuery(""); }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

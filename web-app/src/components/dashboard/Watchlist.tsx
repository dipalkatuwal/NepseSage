"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { nepseAPI, type MarketSymbol } from "@/lib/services";
import { toast } from "sonner";

export function Watchlist() {
  const { user, updateProfileAPI } = useAuth();

  const [watchlistData, setWatchlistData] = useState<MarketSymbol[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MarketSymbol[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const currentWatchlist = user?.watchlist || [];

  // Fetch watchlist data
  useEffect(() => {
    let mounted = true;
    const fetchWatchlistData = async () => {
      if (currentWatchlist.length === 0) {
        if (mounted) {
          setWatchlistData([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const dataPromises = currentWatchlist.map(sym => nepseAPI.getSymbol(sym).catch(() => null));
        const results = await Promise.all(dataPromises);
        if (mounted) {
          setWatchlistData(results.filter(Boolean) as MarketSymbol[]);
        }
      } catch (error) {
        console.error("Failed to fetch watchlist", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWatchlistData();
    return () => { mounted = false; };
  }, [user?.watchlist]);

  // Search logic
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await nepseAPI.searchSymbols(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        // fail silently
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddSymbol = async (symbol: string) => {
    if (currentWatchlist.includes(symbol)) {
      toast.info(`${symbol} is already in your watchlist`);
      return;
    }
    if (currentWatchlist.length >= 10) {
      toast.error("Watchlist is full (max 10)");
      return;
    }
    try {
      await updateProfileAPI({ watchlist: [...currentWatchlist, symbol] });
      toast.success(`Added ${symbol} to watchlist`);
      setPopoverOpen(false);
      setSearchQuery("");
    } catch (err) {
      toast.error("Failed to update watchlist");
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    try {
      await updateProfileAPI({
        watchlist: currentWatchlist.filter(s => s !== symbol)
      });
      toast.success(`Removed ${symbol}`);
    } catch (err) {
      toast.error("Failed to update watchlist");
    }
  };

  // Only show symbols the user explicitly added
  const displayList = watchlistData;

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-5 pb-4">
        <CardTitle className="clinical-label text-sm mt-1">
          {currentWatchlist.length > 0
            ? `Watchlist (${currentWatchlist.length}/10)`
            : "Watchlist"}
        </CardTitle>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Add to Watchlist</h4>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search NEPSE..."
                  className="auth-input pl-9 py-2 text-sm w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {isSearching ? (
                  <p className="text-xs text-center text-muted-foreground py-2">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(res => (
                    <div
                      key={res.symbol}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleAddSymbol(res.symbol)}
                    >
                      <div>
                        <p className="text-sm font-bold">{res.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate w-32">{res.companyName}</p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                ) : searchQuery ? (
                  <p className="text-xs text-center text-muted-foreground py-2">No symbols found</p>
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-2">Type to search</p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 space-y-3">
        {loading
          ? [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
          : displayList.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Your watchlist is empty.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPopoverOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add your first symbol
              </Button>
            </div>
          ) : displayList.map((w) => (
            <HoverCard key={w.symbol} openDelay={200}>
              <HoverCardTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="font-heading text-sm font-bold group-hover:text-primary transition">
                      {w.symbol}
                    </span>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition">
                      {w.sector}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="text-sm">
                        {w.ltp.toFixed(2)}
                      </span>
                      <p
                        className={`text-xs font-semibold ${w.changePercent >= 0 ? "positive" : "negative"}`}
                      >
                        {w.changePercent >= 0 ? "+" : ""}
                        {w.changePercent.toFixed(2)}%
                      </p>
                    </div>
                    {currentWatchlist.includes(w.symbol) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveSymbol(w.symbol);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64" side="left">
                <div className="flex justify-between space-x-4">
                  <Avatar>
                    <AvatarFallback className="font-heading">
                      {w.symbol[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 w-full">
                    <h4 className="text-sm font-semibold">
                      {w.symbol} Overview
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {w.companyName}
                    </p>
                    <div className="flex items-center pt-2 gap-2">
                      <span className="text-xs text-muted-foreground">
                        Vol: {w.volume?.toLocaleString() ?? "—"}
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span
                        className={`text-xs font-semibold ${w.changePercent >= 0 ? "positive" : "negative"}`}
                      >
                        {w.changePercent >= 0 ? "+" : ""}
                        {w.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        {currentWatchlist.length > 0 && (
          <Button
            variant="ghost"
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setPopoverOpen(true)}
          >
            Manage Watchlist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

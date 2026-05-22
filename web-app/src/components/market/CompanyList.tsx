"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { nepseAPI, type MarketSymbol } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

const PAGE_SIZE = 50;

function changeClass(pct: number) {
    return pct > 0 ? "positive" : pct < 0 ? "negative" : "text-muted-foreground";
}

export function CompanyList() {
    const router = useRouter();
    const [allCompanies, setAllCompanies] = useState<MarketSymbol[]>([]);
    const [filtered, setFiltered] = useState<MarketSymbol[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    // Fetch the full list once on mount (no limit → up to 1000 from backend)
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                const data = await nepseAPI.getAllSymbols();
                if (mounted) {
                    setAllCompanies(data);
                    setFiltered(data);
                }
            } catch {
                // fail silently
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    // Client-side filtering so we don't re-fetch on every keystroke
    const handleSearch = useCallback(
        (q: string) => {
            setQuery(q);
            setPage(1);
            if (!q.trim()) {
                setFiltered(allCompanies);
                return;
            }
            const upper = q.toUpperCase();
            setFiltered(
                allCompanies.filter(
                    (c) =>
                        c.symbol.includes(upper) ||
                        (c.companyName ?? "").toLowerCase().includes(q.toLowerCase()) ||
                        (c.sector ?? "").toLowerCase().includes(q.toLowerCase())
                )
            );
        },
        [allCompanies]
    );

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="p-5 pb-4">
                <div className="flex items-center justify-between gap-4">
                    <CardTitle className="clinical-label">All Listed Companies</CardTitle>
                    <span className="text-xs text-muted-foreground">
                        {loading
                            ? "Loading…"
                            : query
                            ? `${filtered.length} of ${allCompanies.length} companies`
                            : `${allCompanies.length} companies`}
                    </span>
                </div>
                <div className="relative mt-3">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Filter by symbol, name, or sector…"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                        disabled={loading}
                    />
                </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                {loading ? (
                    <div className="space-y-2 p-5 pt-0">
                        {[...Array(10)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-md" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                        No companies found{query ? ` for "${query}"` : ""}
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto max-h-[540px]">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-card border-b border-border z-10">
                                    <tr>
                                        <th className="text-left px-5 py-2 clinical-label font-semibold w-24">Symbol</th>
                                        <th className="text-left px-3 py-2 clinical-label font-semibold hidden sm:table-cell">Company</th>
                                        <th className="text-left px-3 py-2 clinical-label font-semibold hidden md:table-cell">Sector</th>
                                        <th className="text-right px-3 py-2 clinical-label font-semibold">LTP</th>
                                        <th className="text-right px-5 py-2 clinical-label font-semibold">Change %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageSlice.map((co, i) => (
                                        <tr
                                            key={co.symbol ? `${co.symbol}-${i}` : `empty-${i}`}
                                            onClick={() => router.push(`/companyDetails/${co.symbol}`)}
                                            className={`border-b border-border/50 hover:bg-secondary/60 cursor-pointer transition-colors ${
                                                i % 2 === 0 ? "" : "bg-secondary/20"
                                            }`}
                                        >
                                            <td className="px-5 py-2.5 font-heading font-bold">{co.symbol}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[180px] hidden sm:table-cell">
                                                {co.companyName || "—"}
                                            </td>
                                            <td className="px-3 py-2.5 hidden md:table-cell">
                                                {co.sector ? (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                                        {co.sector}
                                                    </Badge>
                                                ) : "—"}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-heading">
                                                {co.ltp
                                                    ? co.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                                                    : <span className="text-muted-foreground/50">—</span>}
                                            </td>
                                            <td className={`px-5 py-2.5 text-right font-heading font-semibold ${changeClass(co.changePercent ?? 0)}`}>
                                                {co.changePercent != null && co.ltp > 0
                                                    ? `${co.changePercent >= 0 ? "+" : ""}${co.changePercent.toFixed(2)}%`
                                                    : <span className="text-muted-foreground/50">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-border">
                                <span className="text-xs text-muted-foreground order-2 sm:order-1 font-medium">
                                    Page {page} of {totalPages} · {filtered.length} companies
                                </span>
                                <div className="order-1 sm:order-2">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => page > 1 && setPage(page - 1)}
                                                    className={`hover:bg-secondary cursor-pointer ${
                                                        page === 1 ? "opacity-50 pointer-events-none" : ""
                                                    }`}
                                                />
                                            </PaginationItem>
                                            
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let targetPage = page;
                                                if (page <= 3) {
                                                    targetPage = i + 1;
                                                } else if (page >= totalPages - 2) {
                                                    targetPage = totalPages - 4 + i;
                                                } else {
                                                    targetPage = page - 2 + i;
                                                }
                                                
                                                if (targetPage < 1 || targetPage > totalPages) return null;
                                                
                                                return (
                                                    <PaginationItem key={targetPage}>
                                                        <PaginationLink
                                                            onClick={() => setPage(targetPage)}
                                                            isActive={page === targetPage}
                                                            className={`cursor-pointer h-8 w-8 text-xs ${
                                                                page === targetPage
                                                                    ? "bg-primary/10 border-primary text-primary"
                                                                    : "hover:bg-secondary"
                                                            }`}
                                                        >
                                                            {targetPage}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => page < totalPages && setPage(page + 1)}
                                                    className={`hover:bg-secondary cursor-pointer ${
                                                        page === totalPages ? "opacity-50 pointer-events-none" : ""
                                                    }`}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

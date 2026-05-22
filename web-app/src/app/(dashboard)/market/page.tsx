import type { Metadata } from "next";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarketClient } from "@/app/(dashboard)/market/MarketClient";

export const metadata: Metadata = {
    title: "Market Overview — NepseSage",
    description:
        "Live NEPSE market data — index, top movers, sector performance, and AI-powered market insights.",
};

export default function MarketPage() {
    return (
        <div className="space-y-6">
            <MarketClient activeTab="overview" />
        </div>
    );
}

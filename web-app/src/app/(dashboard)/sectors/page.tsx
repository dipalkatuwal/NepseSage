import type { Metadata } from "next";
import { MarketClient } from "@/app/(dashboard)/market/MarketClient";

export const metadata: Metadata = {
    title: "Sectors — NepseSage",
    description: "NEPSE sectors performance, analysis, and metrics.",
};

export default function SectorsPage() {
    return (
        <div className="space-y-6">
            <MarketClient activeTab="sectors" />
        </div>
    );
}

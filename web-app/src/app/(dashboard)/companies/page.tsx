import type { Metadata } from "next";
import { MarketClient } from "@/app/(dashboard)/market/MarketClient";

export const metadata: Metadata = {
    title: "Companies — NepseSage",
    description: "NEPSE listed companies directory, search, and details.",
};

export default function CompaniesPage() {
    return (
        <div className="space-y-6">
            <MarketClient activeTab="companies" />
        </div>
    );
}

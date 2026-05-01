// ─── NEPSE Market Mock Data ───────────────────────────────────────────────────
// Structured for easy API replacement: swap each export with a fetch call.

export interface NepseIndexPoint {
    time: string;
    value: number;
}

export interface MarketSummaryData {
    indexValue: number;
    change: number;
    changePercent: number;
    status: "Open" | "Closed" | "Pre-Open";
    totalTurnover: number; // NPR crore
    totalTrades: number;
    totalVolume: number;
    high52Week: number;
    low52Week: number;
    lastUpdated: string;
    advances?: number;
    declines?: number;
    unchanged?: number;
    marketCap?: number;
    floatMarketCap?: number;
}

export interface TopMover {
    symbol: string;
    companyName: string;
    ltp: number;
    change: number;
    changePercent: number;
    volume: number;
    sector: string;
}

export interface SectorData {
    name: string;
    shortName: string;
    avgChange: number;
    totalTurnover: number; // NPR crore
    symbolCount: number;
    gainers: number;
    losers: number;
    topSymbol: string;
}

export interface MarketInsight {
    id: string;
    type: "bullish" | "bearish" | "neutral" | "alert";
    title: string;
    body: string;
    symbol?: string;
    confidence: number;
}

export interface QuickViewStock {
    symbol: string;
    companyName: string;
    sector: string;
    ltp: number;
    change: number;
    changePercent: number;
    volume: number;
    pe?: number;
}

// ─── INDEX HISTORY (1D / 1W / 1M) ─────────────────────────────────────────────

export const indexHistory1D: NepseIndexPoint[] = [
    { time: "11:00", value: 2041.2 },
    { time: "11:15", value: 2044.8 },
    { time: "11:30", value: 2039.5 },
    { time: "11:45", value: 2051.3 },
    { time: "12:00", value: 2058.7 },
    { time: "12:15", value: 2055.1 },
    { time: "12:30", value: 2062.4 },
    { time: "12:45", value: 2059.8 },
    { time: "13:00", value: 2071.5 },
    { time: "13:15", value: 2068.2 },
    { time: "13:30", value: 2074.9 },
    { time: "13:45", value: 2078.3 },
    { time: "14:00", value: 2082.1 },
    { time: "14:15", value: 2079.6 },
    { time: "14:30", value: 2085.4 },
    { time: "14:45", value: 2083.2 },
    { time: "15:00", value: 2087.6 },
];

export const indexHistory1W: NepseIndexPoint[] = [
    { time: "Sun", value: 2024.5 },
    { time: "Mon", value: 2031.8 },
    { time: "Tue", value: 2019.3 },
    { time: "Wed", value: 2048.9 },
    { time: "Thu", value: 2041.2 },
    { time: "Fri", value: 2058.4 },
    { time: "Sat", value: 2087.6 },
];

export const indexHistory1M: NepseIndexPoint[] = [
    { time: "May 1", value: 1982.4 },
    { time: "May 5", value: 1994.8 },
    { time: "May 8", value: 1978.3 },
    { time: "May 12", value: 2015.6 },
    { time: "May 15", value: 2008.9 },
    { time: "May 19", value: 2042.1 },
    { time: "May 22", value: 2035.8 },
    { time: "May 26", value: 2051.4 },
    { time: "May 29", value: 2044.7 },
    { time: "Jun 2", value: 2068.3 },
    { time: "Jun 5", value: 2059.9 },
    { time: "Jun 9", value: 2074.2 },
    { time: "Jun 12", value: 2087.6 },
];

// ─── MARKET SUMMARY ────────────────────────────────────────────────────────────

export const marketSummary: MarketSummaryData = {
    indexValue: 2087.64,
    change: 46.44,
    changePercent: 2.27,
    status: "Closed",
    totalTurnover: 8.74, // NPR 8.74 crore
    totalTrades: 84291,
    totalVolume: 24819450,
    high52Week: 2214.3,
    low52Week: 1821.7,
    lastUpdated: "15:00 NPT",
    advances: 145,
    declines: 65,
    unchanged: 12,
    marketCap: 3456789.5, // in Crore
    floatMarketCap: 1234567.8, // in Crore
};

// ─── TOP MOVERS ────────────────────────────────────────────────────────────────

export const topGainers: TopMover[] = [
    { symbol: "UPPER", companyName: "Upper Tamakoshi Hydro", ltp: 245.8, change: 22.1, changePercent: 9.89, volume: 482100, sector: "Hydropower" },
    { symbol: "NICA", companyName: "NIC Asia Bank", ltp: 582.4, change: 38.4, changePercent: 7.06, volume: 324800, sector: "Banking" },
    { symbol: "NABIL", companyName: "Nabil Bank Limited", ltp: 1124.0, change: 64.0, changePercent: 6.04, volume: 198200, sector: "Banking" },
    { symbol: "API", companyName: "Api Power Company", ltp: 198.5, change: 10.5, changePercent: 5.58, volume: 891200, sector: "Hydropower" },
    { symbol: "NLIC", companyName: "Nepal Life Insurance", ltp: 1582.0, change: 82.0, changePercent: 5.47, volume: 94500, sector: "Insurance" },
];

export const topLosers: TopMover[] = [
    { symbol: "SHL", companyName: "Soaltee Hotel Limited", ltp: 398.2, change: -28.3, changePercent: -6.63, volume: 142600, sector: "Hotels" },
    { symbol: "NTC", companyName: "Nepal Telecom", ltp: 844.0, change: -38.5, changePercent: -4.36, volume: 284100, sector: "Telecom" },
    { symbol: "HIDCL", companyName: "Hydro Dev Corp", ltp: 82.4, change: -3.2, changePercent: -3.74, volume: 1284000, sector: "Hydropower" },
    { symbol: "BOKL", companyName: "Bank of Kathmandu", ltp: 212.3, change: -7.7, changePercent: -3.50, volume: 498200, sector: "Banking" },
    { symbol: "SRBL", companyName: "Sunrise Microfinance", ltp: 1548.0, change: -52.0, changePercent: -3.25, volume: 38400, sector: "Microfinance" },
];

// ─── SECTORS ───────────────────────────────────────────────────────────────────

export const sectors: SectorData[] = [
    { name: "Commercial Banks", shortName: "Banking", avgChange: 3.42, totalTurnover: 2.84, symbolCount: 27, gainers: 21, losers: 6, topSymbol: "NICA" },
    { name: "Hydropower", shortName: "Hydro", avgChange: 2.18, totalTurnover: 1.94, symbolCount: 84, gainers: 58, losers: 26, topSymbol: "UPPER" },
    { name: "Life Insurance", shortName: "Insurance", avgChange: 1.74, totalTurnover: 0.98, symbolCount: 19, gainers: 13, losers: 6, topSymbol: "NLIC" },
    { name: "Development Banks", shortName: "Dev Banks", avgChange: 0.84, totalTurnover: 0.64, symbolCount: 17, gainers: 10, losers: 7, topSymbol: "GBIME" },
    { name: "Finance Companies", shortName: "Finance", avgChange: -0.42, totalTurnover: 0.38, symbolCount: 22, gainers: 9, losers: 13, topSymbol: "ICFC" },
    { name: "Microfinance", shortName: "Microfinance", avgChange: -1.14, totalTurnover: 0.44, symbolCount: 64, gainers: 22, losers: 42, topSymbol: "CBBL" },
    { name: "Hotels & Tourism", shortName: "Hotels", avgChange: -2.18, totalTurnover: 0.22, symbolCount: 5, gainers: 1, losers: 4, topSymbol: "SHL" },
    { name: "Telecom", shortName: "Telecom", avgChange: -3.12, totalTurnover: 0.84, symbolCount: 2, gainers: 0, losers: 2, topSymbol: "NTC" },
];

// ─── MARKET INSIGHTS ──────────────────────────────────────────────────────────

export const marketInsights: MarketInsight[] = [
    {
        id: "1",
        type: "bullish",
        title: "Banking Sector: Institutional Accumulation",
        body: "NICA and NABIL showing strong buy-side volume divergence. Commercial banking index up 3.42% — highest single-day gain in 3 weeks.",
        symbol: "NICA",
        confidence: 88,
    },
    {
        id: "2",
        type: "bullish",
        title: "Hydropower: Monsoon Premium Building",
        body: "Pre-monsoon seasonal pattern driving hydropower accumulation. UPPER and API both registered circuit-up. Watch CHCL for continuation.",
        symbol: "UPPER",
        confidence: 76,
    },
    {
        id: "3",
        type: "bearish",
        title: "Telecom: NTC Structural Weakness",
        body: "NTC breaking below 200-day SMA on elevated volume. Revenue pressure from regulatory changes. Target: 800 support zone.",
        symbol: "NTC",
        confidence: 71,
    },
    {
        id: "4",
        type: "neutral",
        title: "NEPSE Index: Resistance at 2,100",
        body: "Index approaching key resistance cluster at 2,100–2,120. RSI at 64 — elevated but not overbought. Volume confirmation needed for breakout.",
        confidence: 82,
    },
    {
        id: "5",
        type: "alert",
        title: "NRB Monetary Policy Watch",
        body: "Nepal Rastra Bank MPC meeting scheduled next week. Market expects 50bps CRR cut — historically bullish for banking liquidity.",
        confidence: 65,
    },
];

// ─── QUICK VIEW ────────────────────────────────────────────────────────────────

export const quickViewStocks: QuickViewStock[] = [
    { symbol: "NICA", companyName: "NIC Asia Bank", sector: "Banking", ltp: 582.4, change: 38.4, changePercent: 7.06, volume: 324800, pe: 18.2 },
    { symbol: "NABIL", companyName: "Nabil Bank", sector: "Banking", ltp: 1124.0, change: 64.0, changePercent: 6.04, volume: 198200, pe: 21.4 },
    { symbol: "UPPER", companyName: "Upper Tamakoshi", sector: "Hydro", ltp: 245.8, change: 22.1, changePercent: 9.89, volume: 482100 },
    { symbol: "NTC", companyName: "Nepal Telecom", sector: "Telecom", ltp: 844.0, change: -38.5, changePercent: -4.36, volume: 284100, pe: 14.8 },
    { symbol: "NLIC", companyName: "Nepal Life Insurance", sector: "Insurance", ltp: 1582.0, change: 82.0, changePercent: 5.47, volume: 94500, pe: 28.1 },
    { symbol: "HIDCL", companyName: "Hydro Dev Corp", sector: "Hydro", ltp: 82.4, change: -3.2, changePercent: -3.74, volume: 1284000 },
    { symbol: "API", companyName: "Api Power", sector: "Hydro", ltp: 198.5, change: 10.5, changePercent: 5.58, volume: 891200 },
    { symbol: "CHCL", companyName: "Chilime Hydropower", sector: "Hydro", ltp: 214.5, change: -4.5, changePercent: -2.05, volume: 214100 },
];

export interface SymbolMaster {
  symbol: string;
  companyName: string;
  sector: string;
  isin: string;
  listingDate: string;
  lotSize: number;
  currentLtp: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high52Week: number;
  low52Week: number;
  noOfKitta: number;
}

export interface StockFundamentals {
  symbol: string;
  eps: { q1: number; q2: number; q3: number; q4: number };
  peRatio: number;
  bookValue: number;
  pbRatio: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  dividendYield: number;
  exDividendDate: string;
  paymentDate: string;
}

export interface CorporateAnnouncement {
  symbol: string;
  type: "agm" | "bonus" | "rights" | "dividend" | "results" | "board";
  title: string;
  description: string;
  announcementDate: string;
  effectiveDate: string;
  amount?: number;
}

export interface FloorsheetEntry {
  id: string;
  date: string;
  symbol: string;
  buyerBroker: number;
  sellerBroker: number;
  quantity: number;
  rate: number;
  amount: number;
  type: "bulk" | "promoter" | "fii" | "mutual_fund" | "regular";
}

export interface CircuitBreaker {
  symbol: string;
  status: "open" | "halted";
  lowerLimit: number;
  upperLimit: number;
  lastTradedPrice: number;
}

export interface MarketTechnical {
  symbol: string;
  rsi: number;
  macdSignal: "bullish" | "bearish" | "neutral";
  sma20: number;
  sma50: number;
  sma200: number;
  momentum: number;
  sentiment: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
}

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const symbolMaster: SymbolMaster[] = [
  {
    symbol: "NICA",
    companyName: "NIC Asia Bank Limited",
    sector: "Banking",
    isin: "NP0000000063",
    listingDate: "2011-08-24",
    lotSize: 100,
    currentLtp: 582.40,
    change: 38.4,
    changePercent: 7.06,
    volume: 324800,
    marketCap: 1284.5,
    high52Week: 625.0,
    low52Week: 420.0,
    noOfKitta: 2205000
  },
  {
    symbol: "NABIL",
    companyName: "Nabil Bank Limited",
    sector: "Banking",
    isin: "NP0000000064",
    listingDate: "1985-11-25",
    lotSize: 100,
    currentLtp: 720.50,
    change: 12.5,
    changePercent: 1.76,
    volume: 154200,
    marketCap: 2004.2,
    high52Week: 750.0,
    low52Week: 510.0,
    noOfKitta: 2781000
  },
  {
    symbol: "UPPER",
    companyName: "Upper Tamakoshi Hydropower",
    sector: "Hydropower",
    isin: "NP0000000065",
    listingDate: "2018-03-12",
    lotSize: 10,
    currentLtp: 450.20,
    change: -5.4,
    changePercent: -1.18,
    volume: 890000,
    marketCap: 954.0,
    high52Week: 500.0,
    low52Week: 310.0,
    noOfKitta: 2118000
  },
  {
    symbol: "SHIVM",
    companyName: "Shivam Cements Limited",
    sector: "Manufacturing",
    isin: "NP0000000066",
    listingDate: "2019-01-15",
    lotSize: 100,
    currentLtp: 510.30,
    change: 15.6,
    changePercent: 3.15,
    volume: 245000,
    marketCap: 1020.6,
    high52Week: 550.0,
    low52Week: 400.0,
    noOfKitta: 2000000
  },
  {
    symbol: "CIT",
    companyName: "Citizen Investment Trust",
    sector: "Investment",
    isin: "NP0000000067",
    listingDate: "1991-04-12",
    lotSize: 100,
    currentLtp: 2150.00,
    change: -45.0,
    changePercent: -2.05,
    volume: 12500,
    marketCap: 1500.0,
    high52Week: 2500.0,
    low52Week: 1800.0,
    noOfKitta: 697000
  }
];

export const fundamentals: StockFundamentals[] = [
  {
    symbol: "NICA",
    eps: { q1: 12.4, q2: 13.2, q3: 14.8, q4: 15.2 },
    peRatio: 18.2,
    bookValue: 320.5,
    pbRatio: 1.82,
    roe: 18.4,
    roa: 1.24,
    debtToEquity: 0.45,
    dividendYield: 2.84,
    exDividendDate: "2026-06-15",
    paymentDate: "2026-07-10"
  },
  {
    symbol: "NABIL",
    eps: { q1: 15.4, q2: 16.2, q3: 17.8, q4: 18.2 },
    peRatio: 20.1,
    bookValue: 350.5,
    pbRatio: 2.05,
    roe: 20.4,
    roa: 1.54,
    debtToEquity: 0.35,
    dividendYield: 3.14,
    exDividendDate: "2026-07-15",
    paymentDate: "2026-08-10"
  }
];

export const announcements: CorporateAnnouncement[] = [
  {
    symbol: "NICA",
    type: "dividend",
    title: "Dividend Announcement - FY 2025",
    description: "Cash dividend of Rs. 18 per share approved",
    announcementDate: "2026-04-28",
    effectiveDate: "2026-06-15",
    amount: 18
  },
  {
    symbol: "NABIL",
    type: "agm",
    title: "Annual General Meeting",
    description: "25th AGM to be held on 2026-07-15",
    announcementDate: "2026-05-01",
    effectiveDate: "2026-07-15"
  }
];

export const floorsheetData: FloorsheetEntry[] = [
  {
    id: "1001",
    date: "2026-05-01T14:30:00",
    symbol: "NICA",
    buyerBroker: 34,
    sellerBroker: 58,
    quantity: 5500,
    rate: 580.0,
    amount: 3190000,
    type: "bulk"
  },
  {
    id: "1002",
    date: "2026-05-01T14:45:00",
    symbol: "UPPER",
    buyerBroker: 44,
    sellerBroker: 12,
    quantity: 12000,
    rate: 450.0,
    amount: 5400000,
    type: "fii"
  }
];

export const circuitBreakers: CircuitBreaker[] = [
  {
    symbol: "NICA",
    status: "open",
    lowerLimit: 524.16,
    upperLimit: 640.64,
    lastTradedPrice: 582.40
  },
  {
    symbol: "UPPER",
    status: "open",
    lowerLimit: 405.18,
    upperLimit: 495.22,
    lastTradedPrice: 450.20
  }
];

export const technicalAnalysis: MarketTechnical[] = [
  {
    symbol: "NICA",
    rsi: 68.4,
    macdSignal: "bullish",
    sma20: 565.2,
    sma50: 540.1,
    sma200: 480.5,
    momentum: 12.4,
    sentiment: "strong_buy"
  },
  {
    symbol: "UPPER",
    rsi: 35.2,
    macdSignal: "bearish",
    sma20: 460.5,
    sma50: 475.2,
    sma200: 490.5,
    momentum: -8.4,
    sentiment: "sell"
  }
];

export const sectorSentiment = [
  { sector: "Banking", sentiment: "Bullish", change: 1.2 },
  { sector: "Hydropower", sentiment: "Bearish", change: -0.8 },
  { sector: "Manufacturing", sentiment: "Neutral", change: 0.1 },
  { sector: "Investment", sentiment: "Bearish", change: -1.5 },
  { sector: "Microfinance", sentiment: "Bullish", change: 2.4 },
  { sector: "Life Insurance", sentiment: "Bullish", change: 1.8 },
  { sector: "Non-Life Insurance", sentiment: "Neutral", change: 0.5 },
  { sector: "Trading", sentiment: "Bearish", change: -0.4 }
];

export function getOHLCVHistory(symbol: string, days: number = 90): OHLCV[] {
  const data: OHLCV[] = [];
  let basePrice = symbol === "NICA" ? 500 : symbol === "UPPER" ? 400 : 600;
  
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 5 || date.getDay() === 6) continue;
    
    const change = (Math.random() - 0.5) * 10;
    const open = basePrice + change;
    const high = open + Math.random() * 5;
    const low = open - Math.random() * 5;
    const close = basePrice + change * 1.5;
    const volume = Math.floor(Math.random() * 10000) + 1000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });
    
    basePrice = close;
  }
  
  return data;
}

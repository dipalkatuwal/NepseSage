import Groq from "groq-sdk";
import MarketData from "../models/MarketData.js";
import JournalEntry from "../models/JournalEntry.js";
import { analyzeSymbol } from "../services/technicalAnalysis.js";

const getGroq = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is missing");
  return new Groq({ apiKey: key });
};

const MODEL = "llama-3.3-70b-versatile";

const SAGE_SYSTEM_PROMPT = `You are NepseSage, an elite financial analyst specializing exclusively in the Nepal Stock Exchange (NEPSE). 

Your expertise:
- Deep knowledge of Nepali listed companies, sectors (Commercial Banks, Hydropower, Insurance, Microfinance, Telecom)
- Technical analysis: RSI, MACD, support/resistance, candlestick patterns
- Fundamental analysis for Nepali context (EPS, P/E, book value, dividend yield)
- NEPSE market structure, trading rules, settlement, broker system
- Macroeconomic factors affecting NEPSE: NRB monetary policy, remittance flows, liquidity

Your tone: Clinical, precise, professional — like a Bloomberg terminal analyst. Use data, not vague platitudes.
Always cite specific price levels, percentages, and indicators when available.
Never give generic advice. Be specific to NEPSE context.

Important disclaimers: Always note that this is analysis, not financial advice. Past performance doesn't guarantee future results.`;


// ============================
// 📊 Analyze Stock (STREAMING)
// ============================
export const analyzeStock = async (req, res) => {
  const { symbol, question } = req.body;

  const marketData = await MarketData.findOne({
    symbol: symbol.toUpperCase(),
  });

  let contextData = "";

  if (marketData) {
    const technical = analyzeSymbol(marketData);

    contextData = `
CURRENT MARKET DATA FOR ${symbol}:
- Last Traded Price: NPR ${marketData.ltp}
- Change: ${marketData.change} (${marketData.changePercent?.toFixed(2)}%)
- 52-Week Range: NPR ${marketData.low52Week} – NPR ${marketData.high52Week}
- Today's Volume: ${marketData.volume?.toLocaleString()} shares
- Sector: ${marketData.sector}
- Company: ${marketData.companyName}

TECHNICAL INDICATORS:
- RSI (14): ${technical.rsi ?? "N/A"}
- MACD: ${technical.macd?.macd ?? "N/A"} | Signal: ${technical.macd?.signal ?? "N/A"} | Histogram: ${technical.macd?.histogram ?? "N/A"}
- SMA 20: NPR ${technical.sma20 ?? "N/A"}
- SMA 50: NPR ${technical.sma50 ?? "N/A"}
- Support Level: NPR ${technical.supportResistance.support ?? "N/A"}
- Resistance Level: NPR ${technical.supportResistance.resistance ?? "N/A"}
- Trend: ${technical.trend}
- Signal: ${technical.signal}
- Accumulation/Distribution: ${technical.accumulationSignal}
    `;
  }

  const userPrompt = question
    ? `${contextData}\n\nUser question: ${question}`
    : `${contextData}\n\nProvide a comprehensive clinical analysis of ${symbol}`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const groq = getGroq();
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SAGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      max_tokens: 1000,
    });

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("AI analysis error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "AI analysis failed", error: err.message });
    }
  }
};


// ============================
// 💬 Chat
// ============================
export const chat = async (req, res) => {
  const { messages, symbol, context } = req.body;

  let systemContext = SAGE_SYSTEM_PROMPT;

  if (symbol) {
    const marketData = await MarketData.findOne({
      symbol: symbol.toUpperCase(),
    });

    if (marketData) {
      const technical = analyzeSymbol(marketData);

      systemContext += `\n\nCurrent focus symbol: ${symbol}
Price: NPR ${marketData.ltp}
RSI: ${technical.rsi}
Trend: ${technical.trend}
Signal: ${technical.signal}`;
    }
  }

  if (context) systemContext += `\n\nAdditional context: ${context}`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const groq = getGroq();
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemContext },
        ...messages,
      ],
      stream: true,
      max_tokens: 1000,
    });

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("AI chat error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "AI chat failed", error: err.message });
    }
  }
};


// ============================
// 📓 Journal Analysis
// ============================
export const analyzeJournalEntry = async (req, res) => {
  const { entryId } = req.body;

  const entry = await JournalEntry.findOne({
    _id: entryId,
    user: req.user._id,
  });

  if (!entry) {
    return res.status(404).json({ message: "Journal entry not found" });
  }

  const prompt = `Analyze this trade journal entry:

Symbol: ${entry.symbol}
Trade Type: ${entry.tradeType}
P&L: ${entry.pnl}
Emotion: ${entry.emotionBefore} → ${entry.emotionAfter ?? "N/A"}
Reasoning: ${entry.reasoning}
Biases: ${entry.detectedBiases.join(", ") || "None"}

Provide behavioral insights and improvements.`;

  try {
    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SAGE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
    });

    const analysis = response.choices[0].message.content;

    await JournalEntry.findByIdAndUpdate(entryId, { aiAnalysis: analysis });

    res.json({ analysis });
  } catch (err) {
    res.status(500).json({
      message: "AI analysis failed",
      error: err.message,
    });
  }
};


// ============================
// Sentiment
// ============================
export const getMarketSentiment = async (req, res) => {
  try {
    const [gainers, losers, topGainers, topLosers] = await Promise.all([
      MarketData.countDocuments({ isActive: true, changePercent: { $gt: 0 } }),
      MarketData.countDocuments({ isActive: true, changePercent: { $lt: 0 } }),
      MarketData.find({ isActive: true }).sort({ changePercent: -1 }).limit(5).lean(),
      MarketData.find({ isActive: true }).sort({ changePercent:  1 }).limit(5).lean(),
    ]);

    const total = gainers + losers;
    const bullRatio = total > 0 ? gainers / total : 0.5;

    let sentiment, summary;

    if (bullRatio >= 0.6) {
      sentiment = "bullish";
      summary = `${gainers} stocks advancing vs ${losers} declining. Broad-based buying pressure with ${Math.round(bullRatio * 100)}% of active counters in positive territory. Liquidity conditions favour momentum continuation near-term.`;
    } else if (bullRatio <= 0.4) {
      sentiment = "bearish";
      summary = `${losers} stocks declining vs ${gainers} advancing. Selling pressure dominates with ${Math.round((1 - bullRatio) * 100)}% of active counters in negative territory. Watch NRB liquidity data and FPO pipeline for reversal triggers.`;
    } else {
      sentiment = "neutral";
      summary = `Market breadth is mixed with ${gainers} gainers and ${losers} decliners. No clear directional bias. Monitor breakout levels on index heavyweights (NABIL, NICA, NLIC) for confirmation of next directional move.`;
    }

    res.json({ sentiment, summary, gainers, losers, topGainers, topLosers });
  } catch (err) {
    res.status(500).json({ message: "Sentiment analysis failed", error: err.message });
  }
};
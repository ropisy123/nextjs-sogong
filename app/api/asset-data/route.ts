// app/api/asset-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const assetSymbolMap: Record<string, string> = {
  "S&P 500": "^GSPC",
  "Kospi": "^KS11",
  "Bitcoin": "BTC-USD",
  "금": "GC=F",
  "국채": "^TNX",
  "원-달러 환율": "KRW=X",
  "부동산": "VNQ",
  "미국금리": "^IRX",       // 미국 단기금리
  "한국금리": "KRWCBDKY=SB" // 한국 콜금리
};

export async function POST(req: NextRequest) {
  const { assets } = await req.json();

  const start = new Date();
  start.setFullYear(start.getFullYear() - 20);
  const end = new Date();

  const dateMap = new Map<string, Record<string, number | string>>();

  for (const asset of assets) {
    const symbol = assetSymbolMap[asset];
    if (!symbol) continue;

    const history = await yahooFinance.historical(symbol, {
      period1: start,
      period2: end,
      interval: '1d',
    });

    for (const point of history) {
      const dateStr = point.date.toISOString().split("T")[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr });
      }
      dateMap.get(dateStr)![asset] = point.close;
    }
  }

  const mergedData = Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );

  return NextResponse.json(mergedData);
}
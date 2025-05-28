'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const assets = [
  "S&P 500", "Kospi", "Bitcoin", "금", "부동산", "미국금리", "한국금리",
];

const models = ["ChatGPT", "Gemini Pro", "LLaMA 3"];

const modelImages: Record<string, string> = {
  ChatGPT: "/logo_chatgpt.png",
  "Gemini Pro": "/logo_gemini.png",
  "LLaMA 3": "/logo_llama.png",
};

const assetCodeMap: Record<string, string> = {
  "S&P 500": "sp500",
  "Kospi": "kospi",
  "Bitcoin": "bitcoin",
  "금": "gold",
  "부동산": "real_estate",
  "미국금리": "us_interest",
  "한국금리": "kr_interest"
};

// ✅ FastAPI 호출 함수
const fetchAiForecast = async (asset: string): Promise<{
  rise: number;
  fall: number;
  stay: number;
  expected_value: number;
}> => {
  const assetCode = assetCodeMap[asset] || asset;
  const query = new URLSearchParams({ asset: assetCode }).toString();
  const response = await fetch(`https://sogong.site/ai-forecast?${query}`);
  if (!response.ok) throw new Error("API 호출 실패");

  const data = await response.json();

  return {
    //rise: data.bullish * 100,   // 0.6 → 60%
    //stay: data.neutral * 100,
    //fall: data.bearish * 100,
    rise: (data.bullish * -100) + (data.neutral * 0) + (data.bearish * 100) + 100,
    stay: 0,
    fall: 0,
    expected_value: data.expected_value,
  };
};

export default function AiPredictionPanel() {
  const [selectedAsset, setSelectedAsset] = useState("S&P 500");
  const [investmentPeriod, setInvestmentPeriod] = useState("1년");
  const [maxLossRate, setMaxLossRate] = useState("10%");
  const [summaryText, setSummaryText] = useState<string>('요약을 불러오는 중...');
  const [predictions, setPredictions] = useState<
    { model: string; rise: number; stay: number; fall: number; expected_value_percent: number }[]
  >([]);

  // ✅ 예측값 로드
  useEffect(() => {
    const loadForecast = async () => {
      try {
        const data = await fetchAiForecast(selectedAsset);

        const rise = data.rise;
        const stay = data.stay;
        const fall = data.fall;
        const expected_value_percent = data.expected_value;

        const updated = models.map((model) => ({
          model,
          rise,
          stay,
          fall,
          expected_value_percent,
        }));

        setPredictions(updated);
      } catch (err) {
        console.error("AI 예측 데이터 로딩 실패:", err);
      }
    };

    loadForecast();
  }, [selectedAsset]);

  const fetchLLMSummary = async (period: string, lossRate: string): Promise<string> => {
  const query = new URLSearchParams({
    duration: period,
    tolerance: lossRate,
  }).toString();

  const response = await fetch(`https://sogong.site/ai-portfolio-advice?${query}`);
  if (!response.ok) throw new Error("요약 데이터 불러오기 실패");

  const data: {
    asset_name: string;
    allocation_ratio: number;
    rationale: string;
  }[] = await response.json();

  const rows = data.map((entry) => `
    <tr>
      <td>${entry.asset_name}</td>
      <td>${entry.allocation_ratio}%</td>
      <td>${entry.rationale}</td>
    </tr>
  `).join("");

  return `
    <table>
      <tr>
        <th>자산</th>
        <th>비중 (%)</th>
        <th>요약 설명</th>
      </tr>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryText('⏳ 요약 생성 중...');
      try {
        const summary = await fetchLLMSummary(investmentPeriod, maxLossRate);
        setSummaryText(summary.trim());
      } catch (error) {
        console.error("요약 요청 실패:", error);
        setSummaryText("❌ 요약을 불러오는 데 실패했습니다.");
      }
    };

    fetchSummary();
  }, [investmentPeriod, maxLossRate]);

  return (
    <div className="bg-white p-4 rounded">
      <h2 className="text-xl font-semibold mb-2 text-black">AI 예측 결과</h2>

      {/* 자산 선택 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {assets.map((asset) => (
          <button
            key={asset}
            onClick={() => setSelectedAsset(asset)}
            className={`px-3 py-1 border rounded text-sm ${
              selectedAsset === asset
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            {asset}
          </button>
        ))}
      </div>

      {/* 예측 막대 영역 */}
      <div className="grid grid-cols-1 gap-4">
        {predictions
          .filter(({ model }) => model === "ChatGPT")
          .map(({ model, rise, stay, fall, expected_value_percent }) => (
            <div key={model} className="p-4 border rounded bg-gray-50 shadow-sm">
              <h3 className="text-center font-semibold mb-4 flex items-center justify-center gap-2 text-black">
                <Image src={modelImages[model]} alt={model} width={24} height={24} />
                <span>{model}</span>
              </h3>

              <div className="text-sm mb-2 text-center text-black">
                자산: <strong>{selectedAsset}</strong>
              </div>

              <div className="relative h-6 rounded-full w-full bg-gray-100 overflow-hidden">
                {/* ✅ 하락 (연한 파랑) */}
                <div
                  className="absolute top-0 bottom-0 left-0 z-10"
                  style={{
                    width: `${fall}%`,
                    //minWidth: "1px",
                    minWidth: "0px",
                    //backgroundColor: '#93c5fd',
                    backgroundColor:'#4ade80',
                  }}
                />
                {/* ✅ 보합 (회색) */}
                <div
                  className="absolute top-0 bottom-0 z-20"
                  style={{
                    left: `${fall}%`,
                    width: `${stay}%`,
                    //minWidth: "1px",
                    minWidth: "0px",
                    backgroundColor: '#d1d5db',
                  }}
                />
                {/* ✅ 상승 (연한 빨강) */}
                <div
                  className="absolute top-0 bottom-0 z-30"
                  style={{
                    left: `${fall + stay}%`,
                    width: `${rise}%`,
                    //minWidth: "1px",
                    minWidth: "0px",
                    backgroundColor: '#4ade80',
                  }}
                />
              </div>
              {/* ✅ 하단 라벨 */}
              <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
                <span>하락</span>
                <span>보합</span>
                <span>상승</span>
              </div>
            </div>
          ))}
      </div>

      {/* 아래쪽: 투자 조건 + 요약 */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* 투자 기간 */}
          <div className="flex items-center gap-2">
            <h4 className="text-black font-medium whitespace-nowrap">📆 투자 기간</h4>
            <select
              value={investmentPeriod}
              onChange={(e) => setInvestmentPeriod(e.target.value)}
              className="px-3 py-1 border rounded text-sm bg-white text-black"
            >
              <option value="1년">1년</option>
              <option value="3년">3년</option>
              <option value="5년">5년</option>
              <option value="10년">10년</option>
            </select>
          </div>

          {/* 손실 허용률 */}
          <div className="flex items-center gap-2">
            <h4 className="text-black font-medium whitespace-nowrap">📉 최대 손실 허용률</h4>
            <select
              value={maxLossRate}
              onChange={(e) => setMaxLossRate(e.target.value)}
              className="px-3 py-1 border rounded text-sm bg-white text-black"
            >
              <option value="5%">5%</option>
              <option value="10%">10%</option>
              <option value="20%">20%</option>
            </select>
          </div>
        </div>

        {/* 요약 출력 */}
        {summaryText && (
          <div
            className="text-sm leading-relaxed text-black"
            dangerouslySetInnerHTML={{
              __html: summaryText
                .trim()
                .replace(/<table/g, '<table class="w-full border border-gray-300 border-collapse text-black"')
                .replace(/<th/g, '<th class="border border-gray-300 px-2 py-1 bg-gray-100 text-left text-black"')
                .replace(/<td/g, '<td class="border border-gray-300 px-2 py-1 text-left text-black"')
            }}
          />
        )}
      </div>
    </div>
  );
}

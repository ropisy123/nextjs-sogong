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

const getRandom = () => Math.floor(Math.random() * 100);

export default function AiPredictionPanel() {
  const [selectedAsset, setSelectedAsset] = useState("S&P 500");
  const [investmentPeriod, setInvestmentPeriod] = useState("1년");
  const [maxLossRate, setMaxLossRate] = useState("10%");
  const [summaryText, setSummaryText] = useState<string>('요약을 불러오는 중...');
  const [predictions, setPredictions] = useState<
    { model: string; rise: number; stay: number; fall: number }[]
  >([]);

  useEffect(() => {
    const generated = models.map((model) => {
      const rise = getRandom();
      const fall = getRandom();
      const stay = Math.max(0, 100 - rise - fall);
      return {
        model,
        rise: Math.max(0, Math.min(rise, 100)),
        stay,
        fall: Math.max(0, Math.min(fall, 100)),
      };
    });
    setPredictions(generated);
  }, [selectedAsset]);

  const fetchLLMSummary = async (period: string, lossRate: string): Promise<string> => {
    const mockSummary = `
      <table className="w-full border border-gray-300 border-collapse text-sm text-black">
        <tbody>
          <tr>
            <th class="...">자산군</th>
            <th class="...">권장 비중 (%)</th>
            <th class="...">선정 이유</th>
          </tr>
        </tbody>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-2 py-1">S&P 500</td>
            <td className="border border-gray-300 px-2 py-1">30%</td>
            <td className="border border-gray-300 px-2 py-1">미국 금리 인하 기대와 견조한 실적 기반의 성장 기대 종목 집중</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">KOSPI</td>
            <td className="border border-gray-300 px-2 py-1">15%</td>
            <td className="border border-gray-300 px-2 py-1">반도체·수출 회복에 따른 저평가 매력과 외국인 수급 기대</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">Bitcoin</td>
            <td className="border border-gray-300 px-2 py-1">10%</td>
            <td className="border border-gray-300 px-2 py-1">반감기 이후 장기 상승 기대 있으나 높은 변동성 감안한 제한적 비중</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">금</td>
            <td className="border border-gray-300 px-2 py-1">15%</td>
            <td className="border border-gray-300 px-2 py-1">금리 하락과 인플레 리스크에 대한 헤지 수단으로서 안정적 역할</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">부동산(한국)</td>
            <td className="border border-gray-300 px-2 py-1">15%</td>
            <td className="border border-gray-300 px-2 py-1">금리 인하 가능성 있으나 실수요 회복 지연으로 중립적 대응 필요</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">미국 금리</td>
            <td className="border border-gray-300 px-2 py-1">15%</td>
            <td className="border border-gray-300 px-2 py-1">금리 하락 시 미국채 및 관련 자산 수익성 개선 가능성</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">한국 금리</td>
            <td className="border border-gray-300 px-2 py-1">15%</td>
            <td className="border border-gray-300 px-2 py-1">완만한 금리 인하 경로에 따른 국내채·현금성 자산 활용 고려</td>
          </tr>
        </tbody>
      </table>`.trim();
    // 실제 API 호출을 대체하는 mock 데이터입니다.  
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSummary), 500);
    });
  };

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryText('⏳ 요약 생성 중...');
      const summary = await fetchLLMSummary(investmentPeriod, maxLossRate);
      setSummaryText(summary.trim()); // 🔥 여기에서 trim() 적용
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
          .map(({ model, rise }) => (
            <div key={model} className="p-4 border rounded bg-gray-50 shadow-sm">
              <h3 className="text-center font-semibold mb-4 flex items-center justify-center gap-2 text-black">
                <Image src={modelImages[model]} alt={model} width={24} height={24} />
                <span>{model}</span>
              </h3>

              <div className="text-sm mb-2 text-center text-black">
                자산: <strong>{selectedAsset}</strong>
              </div>

              <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden w-full">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-green-500 transition-all duration-700"
                  style={{ width: `${rise}%` }}
                  title={`상승 확률: ${rise}%`}
                />
              </div>

              <div className="flex justify-between mt-1 text-xs text-gray-600">
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
                .trim() // 🔥 여기에서도 trim()
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

'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const assets = [
  "S&P 500", "Kospi", "Bitcoin", "금", "부동산", "금리",
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

  // 랜덤 예측값 생성 (클라이언트에서만 실행되도록)
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

  // 요약 생성 API 호출
/*  
  const fetchLLMSummary = async (period: string, lossRate: string) => {
    try {
      const res = await fetch('/api/llm-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentPeriod: period, maxLossRate: lossRate }),
      });
      const data = await res.json();
      return data.summary || '요약 없음';
    } catch (err) {
      console.error('❌ 요약 요청 오류:', err);
      return 'LLM 요약 요청 실패';
    }
  };
*/
  const fetchLLMSummary = async (period: string, lossRate: string): Promise<string> => {
    // 테스트용 더미 요약
    const mockSummary = `
  📈 예측 요약 (${period}, 손실 허용률: ${lossRate})

  - 채권: 금리 하락 가능성으로 완만한 상승 📈
  - 금: 인플레이션 완화에 따라 횡보 예상 ⚖️
  - 나스닥: 기술주 중심으로 반등 기대 📊
  - 미국 대형 가치주: 배당주 중심으로 안정적 흐름 👍
  - 비트코인: 단기 고점 형성 후 조정 가능성 🚨
  - 서울 부동산: 금리 부담 지속으로 약보합세 📉
    `.trim();

    // 실제 API 요청은 일시적으로 막음
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSummary), 500); // 가짜 지연
    });
  };
  // 투자 조건이 바뀔 때 요약 요청
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryText('⏳ 요약 생성 중...');
      const summary = await fetchLLMSummary(investmentPeriod, maxLossRate);
      setSummaryText(summary);
    };
    fetchSummary();
  }, [investmentPeriod, maxLossRate]);

  return (
    <div className="bg-white p-4 rounded shadow">
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

      {/* ChatGPT 예측 게이지 */}
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

              <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
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

      {/* 투자 조건 선택: 투자 기간 + 손실 허용률 */}
      <div className="mt-6 flex flex-wrap items-center gap-6">
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
        <div className="mt-6 p-4 border rounded bg-black text-white whitespace-pre-wrap text-sm leading-relaxed">
          {summaryText}
        </div>
      )}
    </div>
  );
}

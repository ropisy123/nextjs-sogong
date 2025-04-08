// components/AiPredictionPanel.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';

const assets = [
  "금리",
  "부동산",
  "S&P 500",
  "Kospi",
  "Bitcoin",
  "국채",
  "원-달러 환율",
  "금",
];

const models = ["ChatGPT", "Gemini Pro", "LLaMA 3"];

const modelImages: Record<string, string> = {
  "ChatGPT": "/logo_chatgpt.png",
  "Gemini Pro": "/logo_gemini.png",
  "LLaMA 3": "/logo_llama.png",
};

const getRandom = () => Math.floor(Math.random() * 100);

export default function AiPredictionPanel() {
  const [selectedAsset, setSelectedAsset] = useState("S&P 500");

  const predictions = models.map((model) => {
    const rise = getRandom();
    const fall = getRandom();
    const stay = 100 - rise - fall;
    return {
      model,
      rise: Math.max(0, Math.min(rise, 100)),
      stay: Math.max(0, Math.min(stay, 100)),
      fall: Math.max(0, Math.min(fall, 100)),
    };
  });

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2 text-black">AI 예측 결과</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.map(({ model, rise, stay, fall }) => (
          <div key={model} className="p-4 border rounded bg-gray-50 shadow-sm">
            <h3 className="text-center font-semibold mb-2 flex items-center justify-center gap-2 text-black">
              <Image
                src={modelImages[model]}
                alt={model}
                width={24}
                height={24}
              />
              <span>{model}</span>
            </h3>
            <div className="flex justify-around items-center text-sm">
              <div className="text-green-600 flex flex-col items-center">
                📈<span>{rise}%</span>
              </div>
              <div className="text-gray-600 flex flex-col items-center">
                ➖<span>{stay}%</span>
              </div>
              <div className="text-red-500 flex flex-col items-center">
                📉<span>{fall}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

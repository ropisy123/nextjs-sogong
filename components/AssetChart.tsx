
// components/AssetChart.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const assetColors = {
  "금리": '#0EA5E9',
  "부동산": '#F97316',
  "S&P 500": '#10B981',
  "Kospi": '#6366F1',
  "Bitcoin": '#EF4444',
  "국채": '#3B82F6',
  "원-달러 환율": '#8B5CF6',
  "금": '#FFD700',
};

const generateMockData = (type: 'daily' | 'weekly' | 'monthly') => {
  const length = type === 'daily' ? 180 : type === 'weekly' ? 104 : 60;
  const label = type === 'daily' ? 'Day' : type === 'weekly' ? 'Week' : 'Month';
  return Array.from({ length }).map((_, i) => {
    const base = {
      "금리": 2 + Math.random() * 3,
      "부동산": 100 + Math.random() * 20,
      "S&P 500": 3000 + Math.random() * 500,
      "Kospi": 2500 + Math.random() * 300,
      "Bitcoin": 20000 + Math.random() * 10000,
      "국채": 90 + Math.random() * 10,
      "원-달러 환율": 1100 + Math.random() * 100,
      "금": 1800 + Math.random() * 100,
    };
    return {
      date: `${label} ${i + 1}`,
      ...base,
    };
  });
};

type AssetEntry = {
    date: string;
    [key: string]: number | string; // 모든 자산 키가 string이고 값은 number 또는 string
  };

function calculateRelativeData(data: AssetEntry[], selectedAssets: string[]) {
  if (!data.length) return [];
  const base = data[0];
  return data.map((entry) => {
    const newEntry = { date: entry.date };
    selectedAssets.forEach((asset) => {
      newEntry[asset] = ((entry[asset] - base[asset]) / base[asset]) * 100;
    });
    return newEntry;
  });
}

export default function AssetChart() {
  const [selectedAssets, setSelectedAssets] = useState(["금리", "S&P 500"]);
  const [scale, setScale] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [rawData, setRawData] = useState(generateMockData(scale));
  const [viewRange, setViewRange] = useState([0, 36]);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);

  useEffect(() => {
    const newData = generateMockData(scale);
    setRawData(newData);
    setViewRange([0, scale === 'daily' ? 90 : scale === 'weekly' ? 52 : 36]);
  }, [scale]);

  const data = calculateRelativeData(rawData.slice(viewRange[0], viewRange[1]), selectedAssets);

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset)
        ? prev.filter((a) => a !== asset)
        : [...prev, asset]
    );
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const rangeSize = viewRange[1] - viewRange[0];
    let newSize = delta > 0 ? rangeSize + 6 : rangeSize - 6;
    newSize = Math.max(6, Math.min(rawData.length, newSize));

    const mid = Math.floor((viewRange[0] + viewRange[1]) / 2);
    let newStart = Math.max(0, mid - Math.floor(newSize / 2));
    let newEnd = Math.min(rawData.length, newStart + newSize);

    if (newEnd - newStart < newSize) {
      newStart = Math.max(0, newEnd - newSize);
    }

    setViewRange([newStart, newEnd]);
  };

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    document.body.style.userSelect = 'none';
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) < 10) return;
    const offset = Math.round(deltaX / 10);
    let newStart = Math.max(0, viewRange[0] - offset);
    let newEnd = Math.min(rawData.length, viewRange[1] - offset);
    if (newEnd - newStart === viewRange[1] - viewRange[0]) {
      setViewRange([newStart, newEnd]);
    }
    dragStartX.current = e.clientX;
  };

  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('wheel', handleWheel, { passive: false });
      ref.addEventListener('mousedown', handleMouseDown);
      ref.addEventListener('mouseup', handleMouseUp);
      ref.addEventListener('mouseleave', handleMouseUp);
      ref.addEventListener('mousemove', handleMouseMove);
      return () => {
        ref.removeEventListener('wheel', handleWheel);
        ref.removeEventListener('mousedown', handleMouseDown);
        ref.removeEventListener('mouseup', handleMouseUp);
        ref.removeEventListener('mouseleave', handleMouseUp);
        ref.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [viewRange]);

  return (
    <div
      ref={containerRef}
      className="bg-white p-4 rounded shadow cursor-grab select-none relative"
    >
      <h2 className="text-xl font-semibold mb-2">자산 변동 싸이클 (%)</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.keys(assetColors).map((asset) => (
          <button
            key={asset}
            onClick={() => toggleAsset(asset)}
            className={`px-3 py-1 border rounded text-sm ${
              selectedAssets.includes(asset)
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            {asset}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} tickFormatter={(v) => `${v.toFixed(0)}%`} />
          <Tooltip formatter={(value) => `${(value as number).toFixed(2)}%`} />
          <Legend />
          {selectedAssets.map((asset) => (
            <Line
              key={asset}
              type="monotone"
              dataKey={asset}
              stroke={assetColors[asset as keyof typeof assetColors]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="absolute bottom-4 right-4 flex gap-2">
        {['daily', 'weekly', 'monthly'].map((type) => (
          <button
            key={type}
            onClick={() => setScale(type as 'daily' | 'weekly' | 'monthly')}
            className={`px-3 py-1 border rounded text-sm ${
              scale === type ? 'bg-gray-300 text-black' : 'bg-white text-gray-700'
            }`}
          >
            {type === 'daily' ? '일' : type === 'weekly' ? '주' : '월'}
          </button>
        ))}
      </div>
    </div>
  );
}

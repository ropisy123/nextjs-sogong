'use client';
import { useState, useRef, useEffect } from 'react';
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

const assetList = [
  "S&P 500",
  "Kospi",
  "Bitcoin",
  "금",
  "부동산",
  "금리",
];

const generateMockCorrelationData = (scale: 'daily' | 'weekly' | 'monthly') => {
  const length = scale === 'daily' ? 180 : scale === 'weekly' ? 104 : 60;
  const label = scale === 'daily' ? 'Day' : scale === 'weekly' ? 'Week' : 'Month';
  return Array.from({ length }, (_, i) => ({
    date: `${label} ${i + 1}`,
    correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)),
  }));
};

export default function CorrelationTrendChart() {
  const [assetA, setAssetA] = useState("금리");
  const [assetB, setAssetB] = useState("S&P 500");
  const [scale, setScale] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [data, setData] = useState(generateMockCorrelationData(scale));
  const [viewRange, setViewRange] = useState<[number, number]>([0, 36]);
  const [showWarning, setShowWarning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastViewRange = useRef<[number, number]>([0, 36]);

  useEffect(() => {
    if (assetA === assetB) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
      setData(generateMockCorrelationData(scale));
      setViewRange([0, scale === 'daily' ? 60 : scale === 'weekly' ? 36 : 24]);
    }
  }, [assetA, assetB, scale]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const rangeSize = viewRange[1] - viewRange[0];
    let newSize = delta > 0 ? rangeSize + 6 : rangeSize - 6;
    newSize = Math.max(6, Math.min(data.length, newSize));

    const mid = Math.floor((viewRange[0] + viewRange[1]) / 2);
    let newStart = Math.max(0, mid - Math.floor(newSize / 2));
    let newEnd = Math.min(data.length, newStart + newSize);

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
    let newEnd = Math.min(data.length, viewRange[1] - offset);
    if (newEnd - newStart === viewRange[1] - viewRange[0]) {
      setViewRange([newStart, newEnd]);
    }
    dragStartX.current = e.clientX;
  };

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastViewRange.current = [...viewRange];
    } else if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const offset = Math.round(deltaX / 10);
      let newStart = Math.max(0, lastViewRange.current[0] - offset);
      let newEnd = Math.min(data.length, lastViewRange.current[1] - offset);
      if (newEnd - newStart === viewRange[1] - viewRange[0]) {
        setViewRange([newStart, newEnd]);
      }
    } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const newDistance = getDistance(e.touches);
      const scaleChange = newDistance - lastTouchDistance.current;

      const rangeSize = viewRange[1] - viewRange[0];
      let newSize = scaleChange > 0 ? rangeSize - 6 : rangeSize + 6;
      newSize = Math.max(6, Math.min(data.length, newSize));

      const mid = Math.floor((viewRange[0] + viewRange[1]) / 2);
      let newStart = Math.max(0, mid - Math.floor(newSize / 2));
      let newEnd = Math.min(data.length, newStart + newSize);
      if (newEnd - newStart < newSize) {
        newStart = Math.max(0, newEnd - newSize);
      }

      setViewRange([newStart, newEnd]);
      lastTouchDistance.current = newDistance;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    lastTouchDistance.current = null;
  };

  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('wheel', handleWheel, { passive: false });
      ref.addEventListener('mousedown', handleMouseDown);
      ref.addEventListener('mouseup', handleMouseUp);
      ref.addEventListener('mouseleave', handleMouseUp);
      ref.addEventListener('mousemove', handleMouseMove);

      ref.addEventListener('touchstart', handleTouchStart, { passive: false });
      ref.addEventListener('touchmove', handleTouchMove, { passive: false });
      ref.addEventListener('touchend', handleTouchEnd);

      return () => {
        ref.removeEventListener('wheel', handleWheel);
        ref.removeEventListener('mousedown', handleMouseDown);
        ref.removeEventListener('mouseup', handleMouseUp);
        ref.removeEventListener('mouseleave', handleMouseUp);
        ref.removeEventListener('mousemove', handleMouseMove);

        ref.removeEventListener('touchstart', handleTouchStart);
        ref.removeEventListener('touchmove', handleTouchMove);
        ref.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [viewRange, data]);

  return (
    <div ref={containerRef} className="bg-white p-4 rounded shadow select-none cursor-grab relative">
      <h2 className="text-xl font-semibold mb-2 text-black">자산 상관관계 변동 싸이클</h2>
      {showWarning && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-sm">
          자산 A와 B는 서로 달라야 합니다. 다른 자산을 선택해주세요.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">A : </label>
          <select
            value={assetA}
            onChange={(e) => setAssetA(e.target.value)}
            className="border p-2 rounded w-full text-black"
          >
            {assetList.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">B : </label>
          <select
            value={assetB}
            onChange={(e) => setAssetB(e.target.value)}
            className="border p-2 rounded w-full text-black"
          >
            {assetList.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!showWarning && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.slice(viewRange[0], viewRange[1])}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[-1, 1]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="correlation" stroke="#6366F1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
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

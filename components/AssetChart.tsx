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
import { saveAs } from 'file-saver';

const assetColors = {
  "S&P 500": '#10B981',
  "Kospi": '#6366F1',
  "Bitcoin": '#EF4444',
  "금": '#FFD700',
  "부동산": '#F97316',
  "금리": '#0EA5E9',
};

type AssetEntry = {
  date: string;
  [key: string]: number | string;
};

const cache: Record<string, AssetEntry[]> = {};

function exportCacheToCSV() {
  const allDates = new Set<string>();
  Object.values(cache).flat().forEach((row) => allDates.add(row.date));
  const sortedDates = Array.from(allDates).sort();

  const allAssets = Object.keys(cache);
  const rows = [['date', ...allAssets].join(',')];

  for (const date of sortedDates) {
    const row = [date];
    for (const asset of allAssets) {
      const found = cache[asset].find(d => d.date === date);
      row.push(found ? String(found[asset]) : '');
    }
    rows.push(row.join(','));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, 'asset_cache.csv');
}

async function fetchAssetDataReal(assets: string[]): Promise<AssetEntry[]> {
  const missing = assets.filter(asset => !cache[asset]);
  if (missing.length) {
    const res = await fetch('/api/asset-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets: missing }),
    });
    const newData: AssetEntry[] = await res.json();
    newData.forEach((row) => {
      for (const asset of missing) {
        if (row[asset] !== undefined) {
          if (!cache[asset]) cache[asset] = [];
          cache[asset].push({ date: row.date, [asset]: row[asset] });
        }
      }
    });
  }

  const allDates = new Set<string>();
  assets.forEach(asset => {
    (cache[asset] || []).forEach(row => allDates.add(row.date));
  });

  const sortedDates = Array.from(allDates).sort();
  const mergedMap = new Map<string, AssetEntry>();
  let lastValues: Record<string, number> = {};

  for (const date of sortedDates) {
    const row: AssetEntry = { date };
    for (const asset of assets) {
      const entry = cache[asset]?.find(d => d.date === date);
      if (entry && typeof entry[asset] === 'number') {
        row[asset] = entry[asset];
        lastValues[asset] = entry[asset] as number;
      } else if (lastValues[asset] !== undefined) {
        row[asset] = lastValues[asset];
      }
    }
    mergedMap.set(date, row);
  }

  return Array.from(mergedMap.values());
}

function calculateNormalizedData(data: AssetEntry[], selectedAssets: string[]) {
  if (!data.length) return [];

  const minMaxMap: Record<string, { min: number; max: number }> = {};

  selectedAssets.forEach((asset) => {
    if (asset === "금리") return; // 금리는 정규화하지 않음
    const values = data
      .map((entry) => entry[asset])
      .filter((v): v is number => typeof v === 'number');
    const min = Math.min(...values);
    const max = Math.max(...values);
    minMaxMap[asset] = { min, max };
  });

  return data.map((entry) => {
    const newEntry: { [key: string]: number | string } = { date: entry.date };
    selectedAssets.forEach((asset) => {
      const value = entry[asset];
      if (typeof value !== 'number') return;

      newEntry[`${asset}_original`] = value;

      if (asset === "금리") {
        newEntry[asset] = value; // 금리는 정규화하지 않고 원래 값
      } else {
        const { min, max } = minMaxMap[asset];
        newEntry[asset] = max === min ? 0 : ((value - min) / (max - min)) * 100;
      }
    });
    return newEntry;
  });
}

function downsampleData(data: AssetEntry[], scale: 'daily' | 'weekly' | 'monthly') {
  if (scale === 'daily') return data;

  const result: AssetEntry[] = [];
  let buffer: AssetEntry[] = [];
  let lastKey = '';

  const getGroupKey = (dateStr: string) => {
    const date = new Date(dateStr);
    if (scale === 'weekly') {
      const week = Math.floor((date.getDate() + date.getDay()) / 7);
      return `${date.getFullYear()}-W${week}`;
    }
    return dateStr.slice(0, 7);
  };

  const pushGroup = () => {
    if (!buffer.length) return;
    const agg: AssetEntry = { date: buffer[buffer.length - 1].date };
    const keys = Object.keys(buffer[0]).filter(k => k !== 'date');
    for (const key of keys) {
      const vals = buffer.map(row => row[key] as number).filter(v => typeof v === 'number');
      agg[key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    result.push(agg);
    buffer = [];
  };

  for (const row of data) {
    const groupKey = getGroupKey(row.date as string);
    if (groupKey !== lastKey && buffer.length) pushGroup();
    buffer.push(row);
    lastKey = groupKey;
  }
  pushGroup();

  return result;
}

export default function AssetChart() {
  const [selectedAssets, setSelectedAssets] = useState(["S&P 500"]);
  const [scale, setScale] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [rawData, setRawData] = useState<AssetEntry[]>([]);
  const [viewRange, setViewRange] = useState<[number, number]>([0, 90]);
  const isInitial = useRef(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);



  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const size = viewRange[1] - viewRange[0];
    let newSize = Math.max(6, size + (delta > 0 ? 6 : -6));
    const mid = Math.floor((viewRange[0] + viewRange[1]) / 2);
    let start = Math.max(0, mid - Math.floor(newSize / 2));
    let end = start + newSize;
    setViewRange([start, end]);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const offset = Math.round((e.clientX - dragStartX.current) / 10);
    let newStart = Math.max(0, viewRange[0] - offset);
    let newEnd = Math.min(rawData.length, viewRange[1] - offset);
    setViewRange([newStart, newEnd]);
    dragStartX.current = e.clientX;
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAssetDataReal(selectedAssets);
      setRawData(data);
    };
    fetchData();
  }, [selectedAssets]);

  useEffect(() => {
    const scaled = downsampleData(rawData, scale);
    const length = scale === 'monthly' ? 7 : scale === 'weekly' ? 52 : 90;
    const total = scaled.length;
  
    // 최초 로딩이거나 scale이 바뀔 때만 viewRange 초기화
    if (isInitial.current || viewRange[1] > total || viewRange[1] - viewRange[0] < 6) {
      setViewRange([Math.max(0, total - length), total]);
    }
  
    isInitial.current = false;
  }, [scale, rawData]);
  
  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('wheel', handleWheel, { passive: false });
      ref.addEventListener('mousemove', handleMouseMove);
      ref.addEventListener('mousedown', (e) => {
        isDragging.current = true;
        dragStartX.current = e.clientX;
        document.body.style.userSelect = 'none';
      });
      ref.addEventListener('mouseup', () => {
        isDragging.current = false;
        document.body.style.userSelect = '';
      });
    }
    return () => {
      ref?.removeEventListener('wheel', handleWheel);
      ref?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewRange]);

  const scaled = downsampleData(rawData, scale);
  const sliced = scaled.slice(viewRange[0], viewRange[1]);
  const data = calculateNormalizedData(sliced, selectedAssets);

  return (
    <div
      ref={containerRef}
      className="bg-white p-4 rounded shadow cursor-grab select-none relative"
    >
      <h2 className="text-xl font-semibold mb-2 text-black">자산 변동 싸이클</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.keys(assetColors).map((asset) => (
          <button
            key={asset}
            onClick={() =>
              setSelectedAssets(prev =>
                prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
              )
            }
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
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              if (scale === 'monthly') return value.slice(0, 7);
              if (scale === 'weekly') return value.replace('-W', '주 ');
              return value;
            }}
          />
          {/* 왼쪽 Y축 - 정규화된 자산 */}
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
          />
          {/* 오른쪽 Y축 - 금리 (원래 값) */}
          {selectedAssets.includes("금리") && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => v.toFixed(2)}
              domain={() => {
                const values = data
                  .map(d => d["금리"])
                  .filter((v): v is number => typeof v === 'number');
                const min = Math.min(...values);
                const max = Math.max(...values);
                return [min, max];
              }}
            />
          )}
          <Tooltip
            formatter={(v: any, name: string, props: any) => {
              const original = props.payload[`${name}_original`];
              return [
                name === "금리"
                  ? `${original?.toFixed?.(2) ?? 'N/A'}`
                  : `${(v as number).toFixed(2)}% (원: ${original?.toFixed?.(2) ?? 'N/A'})`,
                name,
              ];
            }}
          />
          <Legend />
          {selectedAssets.map((asset) => (
            <Line
              key={asset}
              type="monotone"
              dataKey={asset}
              stroke={assetColors[asset as keyof typeof assetColors]}
              strokeWidth={2}
              dot={false}
              yAxisId={asset === "금리" ? "right" : "left"}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="absolute bottom-4 right-4 flex gap-2">
        {['daily', 'weekly', 'monthly'].map((type) => (
          <button
            key={type}
            onClick={() => setScale(type as any)}
            className={`px-3 py-1 border rounded text-sm ${
              scale === type ? 'bg-gray-300 text-black' : 'bg-white text-gray-700'
            }`}
          >
            {type === 'daily' ? '일' : type === 'weekly' ? '주' : '월'}
          </button>
        ))}
{/*}
        <button
          onClick={exportCacheToCSV}
          className="px-3 py-1 border rounded text-sm bg-green-500 text-white"
        >
          Raw Data 다운로드
        </button>
*/}      
      </div>
    </div>
  );
}

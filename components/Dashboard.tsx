// components/Dashboard.tsx
'use client';
import AssetChart from './AssetChart';
import AiPredictionPanel from './AiPredictionPanel';
import CorrelationMatrix from './CorrelationMatrix';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetChart />
        <CorrelationMatrix />
      </div>
      <AiPredictionPanel />
    </div>
  );
}
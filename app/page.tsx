import Image from "next/image";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="p-6 min-h-screen bg-gray-100 flex flex-col justify-between">
      <div>
      <h1 className="text-3xl font-bold mb-4 text-black">자산 싸이클 분석</h1>
        <Dashboard />
      </div>
      <footer className="text-xs text-gray-500 mt-10 border-t pt-4">
        주의: 본 페이지는 테스트 목적으로 생성된 임시 데이터를 사용하고 있습니다. 실제 투자 판단 또는 금융 의사결정에 본 페이지의 정보를 이용하는 것은 적절하지 않으며, 이로 인한 손해에 대해 책임지지 않습니다.
      </footer>
    </main>
  );
}
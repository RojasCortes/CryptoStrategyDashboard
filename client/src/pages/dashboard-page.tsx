import { useState } from "react";
import { Strategy } from "@shared/schema";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ApiStatusAlert } from "@/components/dashboard/api-status-alert";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { StrategyList } from "@/components/dashboard/strategy-list";
import { ConfigPanel } from "@/components/dashboard/config-panel";
import { PerformanceCharts } from "@/components/dashboard/performance-charts";
import { RecentTrades } from "@/components/dashboard/recent-trades";

export default function DashboardPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const handleStrategySelect = (strategy: Strategy | null) => {
    setSelectedStrategy(strategy);
  };

  const handleStrategyUpdated = () => {
    setSelectedStrategy(null);
  };

  return (
    <DashboardLayout 
      title="Dashboard"
      subtitle="Resumen general de tu trading"
    >
      <ApiStatusAlert />
      
      <MarketOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StrategyList onStrategySelect={handleStrategySelect} />
        </div>
        
        <div>
          <ConfigPanel 
            selectedStrategy={selectedStrategy} 
            onStrategyUpdated={handleStrategyUpdated} 
          />
        </div>
      </div>
      
      <PerformanceCharts selectedStrategy={selectedStrategy} />
      
      <RecentTrades />
    </DashboardLayout>
  );
}

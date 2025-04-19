import { useState } from "react";
import { Strategy } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { ApiStatusAlert } from "@/components/dashboard/api-status-alert";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { StrategyList } from "@/components/dashboard/strategy-list";
import { ConfigPanel } from "@/components/dashboard/config-panel";
import { PerformanceCharts } from "@/components/dashboard/performance-charts";
import { RecentTrades } from "@/components/dashboard/recent-trades";

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleStrategySelect = (strategy: Strategy | null) => {
    setSelectedStrategy(strategy);
  };

  const handleStrategyUpdated = () => {
    // Refresh data or clear selection as needed
    setSelectedStrategy(null);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* App Bar */}
        <AppBar toggleSidebar={toggleSidebar} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-muted">
          {/* API Connection Status */}
          <ApiStatusAlert />
          
          {/* Market Overview */}
          <MarketOverview />
          
          {/* Trading Strategies & Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strategies List */}
            <div className="lg:col-span-2">
              <StrategyList onStrategySelect={handleStrategySelect} />
            </div>
            
            {/* Configuration Panel */}
            <div>
              <ConfigPanel 
                selectedStrategy={selectedStrategy} 
                onStrategyUpdated={handleStrategyUpdated} 
              />
            </div>
          </div>
          
          {/* Performance Charts */}
          <PerformanceCharts selectedStrategy={selectedStrategy} />
          
          {/* Recent Trades */}
          <RecentTrades />
        </main>
      </div>
    </div>
  );
}

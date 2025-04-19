import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import CryptoCard from "@/components/dashboard/crypto-card";
import StrategyCard from "@/components/dashboard/strategy-card";
import PriceChart from "@/components/dashboard/price-chart";
import TradeTable from "@/components/dashboard/trade-table";
import NotificationSettings from "@/components/dashboard/notification-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, MenuIcon, SearchIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Fetch market data
  const { data: marketData = [] } = useQuery({
    queryKey: ["/api/market/symbols"],
    enabled: !!user,
  });
  
  // Fetch user's strategies
  const { data: strategies = [] } = useQuery({
    queryKey: ["/api/strategies"],
    enabled: !!user,
  });
  
  // Fetch recent trades
  const { data: recentTrades = [] } = useQuery({
    queryKey: ["/api/trade-history"],
    enabled: !!user,
  });
  
  // Function to toggle mobile sidebar
  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  // Redirect to strategies page with create action
  const handleCreateStrategy = () => {
    navigate("/strategies?create=true");
  };
  
  // Set document title
  useEffect(() => {
    document.title = "Dashboard | CryptoTrader";
  }, []);
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar component */}
      <Sidebar visible={showMobileSidebar} currentPath="/" onClose={() => setShowMobileSidebar(false)} />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button 
            onClick={toggleSidebar}
            className="md:hidden px-4 text-gray-500 focus:outline-none focus:bg-gray-100"
          >
            <MenuIcon size={24} />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">Search</label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <SearchIcon className="ml-3" size={20} />
                  </div>
                  <Input 
                    id="search-field" 
                    className="block w-full h-full pl-10 pr-3 py-2 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 sm:text-sm" 
                    placeholder="Search crypto, strategies..." 
                    type="search"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" tabIndex={0}>
          <div className="py-6">
            <div className="px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="px-4 sm:px-6 md:px-8">
              {/* Market Overview */}
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Market Overview</h2>
                <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {marketData.slice(0, 4).map((crypto, index) => (
                    <CryptoCard key={index} crypto={crypto} />
                  ))}
                </div>
              </div>
              
              {/* Trading Strategy Cards */}
              <div className="mt-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Your Trading Strategies</h2>
                  <Button onClick={handleCreateStrategy} className="flex items-center">
                    <PlusIcon className="mr-2" size={16} />
                    New Strategy
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {strategies.length > 0 ? (
                    strategies.map((strategy) => (
                      <StrategyCard key={strategy.id} strategy={strategy} />
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center">
                      <p className="text-gray-500">No strategies found. Create your first strategy!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Market Chart */}
              <div className="mt-8">
                <PriceChart />
              </div>
              
              {/* Recent Trades & Email Notifications */}
              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Recent Trades */}
                <TradeTable trades={recentTrades} />
                
                {/* Email Notifications */}
                <NotificationSettings />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

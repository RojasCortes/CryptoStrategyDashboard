import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/dashboard/sidebar";
import StrategyForm from "@/components/strategies/strategy-form";
import StrategyCard from "@/components/dashboard/strategy-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, MenuIcon, SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StrategiesPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  
  // Get URL parameters
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const createParam = urlParams.get("create");
  const editParam = urlParams.get("edit");
  
  // Fetch user's strategies
  const { data: strategies = [], refetch: refetchStrategies } = useQuery({
    queryKey: ["/api/strategies"],
    enabled: !!user,
  });
  
  // Fetch strategy types
  const { data: strategyTypes = [] } = useQuery({
    queryKey: ["/api/strategy-types"],
    enabled: !!user,
  });
  
  // Function to toggle mobile sidebar
  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  // Handle creating a new strategy
  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    setShowForm(true);
  };
  
  // Handle editing a strategy
  const handleEditStrategy = (strategy: any) => {
    setSelectedStrategy(strategy);
    setShowForm(true);
  };
  
  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStrategy(null);
    // Clean up URL params
    navigate("/strategies");
    // Refetch strategies
    refetchStrategies();
  };
  
  // Process URL parameters
  useEffect(() => {
    if (createParam === "true") {
      handleCreateStrategy();
    } else if (editParam) {
      const strategyId = parseInt(editParam);
      const strategy = strategies.find(s => s.id === strategyId);
      if (strategy) {
        handleEditStrategy(strategy);
      }
    }
  }, [createParam, editParam, strategies]);
  
  // Set document title
  useEffect(() => {
    document.title = "Strategies | CryptoTrader";
  }, []);
  
  // Group strategies by status (active vs paused)
  const activeStrategies = strategies.filter(s => s.isActive);
  const pausedStrategies = strategies.filter(s => !s.isActive);
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar component */}
      <Sidebar 
        visible={showMobileSidebar} 
        currentPath="/strategies" 
        onClose={() => setShowMobileSidebar(false)} 
      />
      
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
                    placeholder="Search strategies..." 
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
              <h1 className="text-2xl font-semibold text-gray-900">Trading Strategies</h1>
            </div>
            
            <div className="px-4 sm:px-6 md:px-8">
              {showForm ? (
                <StrategyForm 
                  strategy={selectedStrategy}
                  onClose={handleFormClose}
                  strategyTypes={strategyTypes}
                />
              ) : (
                <>
                  {/* Strategies Header */}
                  <div className="mt-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">All Strategies</h2>
                    <Button onClick={handleCreateStrategy} className="flex items-center">
                      <PlusIcon className="mr-2" size={16} />
                      New Strategy
                    </Button>
                  </div>
                  
                  {/* Strategies List */}
                  {strategies.length > 0 ? (
                    <Tabs defaultValue="all" className="mt-4">
                      <TabsList>
                        <TabsTrigger value="all">All ({strategies.length})</TabsTrigger>
                        <TabsTrigger value="active">Active ({activeStrategies.length})</TabsTrigger>
                        <TabsTrigger value="paused">Paused ({pausedStrategies.length})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="mt-4">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {strategies.map((strategy) => (
                            <StrategyCard 
                              key={strategy.id} 
                              strategy={strategy} 
                              onEdit={() => handleEditStrategy(strategy)}
                            />
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="active" className="mt-4">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {activeStrategies.length > 0 ? (
                            activeStrategies.map((strategy) => (
                              <StrategyCard 
                                key={strategy.id} 
                                strategy={strategy} 
                                onEdit={() => handleEditStrategy(strategy)}
                              />
                            ))
                          ) : (
                            <div className="col-span-full py-10 text-center">
                              <p className="text-gray-500">No active strategies found.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="paused" className="mt-4">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {pausedStrategies.length > 0 ? (
                            pausedStrategies.map((strategy) => (
                              <StrategyCard 
                                key={strategy.id} 
                                strategy={strategy} 
                                onEdit={() => handleEditStrategy(strategy)}
                              />
                            ))
                          ) : (
                            <div className="col-span-full py-10 text-center">
                              <p className="text-gray-500">No paused strategies found.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-center">No Strategies Found</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-gray-500 mb-4">You haven't created any trading strategies yet.</p>
                        <Button onClick={handleCreateStrategy}>Create Your First Strategy</Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Chart from "chart.js/auto";
import { Skeleton } from "@/components/ui/skeleton";
import { Strategy } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface PerformanceChartsProps {
  selectedStrategy: Strategy | null;
}

export function PerformanceCharts({ selectedStrategy }: PerformanceChartsProps) {
  const pnlChartRef = useRef<HTMLCanvasElement | null>(null);
  const winLossChartRef = useRef<HTMLCanvasElement | null>(null);
  const pnlChartInstance = useRef<Chart | null>(null);
  const winLossChartInstance = useRef<Chart | null>(null);
  
  // Fetch trades for the selected strategy
  const { data: trades, isLoading } = useQuery({
    queryKey: selectedStrategy 
      ? [`/api/trades/strategy/${selectedStrategy.id}`]
      : ["/api/trades"],
    enabled: true,
  });

  // Create/update PnL chart
  useEffect(() => {
    if (!pnlChartRef.current || isLoading) return;
    
    // Destroy previous chart if it exists
    if (pnlChartInstance.current) {
      pnlChartInstance.current.destroy();
    }
    
    // Sample data for demonstration
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const data = [2.3, 3.1, -0.8, 1.7, 2.6, 5.3, 2.9];
    
    // Create new chart
    pnlChartInstance.current = new Chart(pnlChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Profit/Loss %',
            data,
            borderColor: '#1976D2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}%`;
              },
            },
          },
        },
      },
    });
    
    return () => {
      if (pnlChartInstance.current) {
        pnlChartInstance.current.destroy();
      }
    };
  }, [isLoading, pnlChartRef, trades]);
  
  // Create/update Win/Loss chart
  useEffect(() => {
    if (!winLossChartRef.current || isLoading) return;
    
    // Destroy previous chart if it exists
    if (winLossChartInstance.current) {
      winLossChartInstance.current.destroy();
    }
    
    // Sample data for demonstration
    const data = {
      labels: ['Winning Trades', 'Losing Trades'],
      datasets: [
        {
          data: [65, 35],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 0,
        },
      ],
    };
    
    // Create new chart
    winLossChartInstance.current = new Chart(winLossChartRef.current, {
      type: 'pie',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}%`;
              },
            },
          },
        },
      },
    });
    
    return () => {
      if (winLossChartInstance.current) {
        winLossChartInstance.current.destroy();
      }
    };
  }, [isLoading, winLossChartRef, trades]);

  return (
    <section className="mt-6">
      <h2 className="text-xl font-medium mb-4">Performance Analysis</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Profit/Loss Performance</h3>
            {isLoading ? (
              <div className="aspect-video bg-muted rounded flex items-center justify-center">
                <Skeleton className="h-[80%] w-[90%]" />
              </div>
            ) : (
              <div className="aspect-video">
                <canvas ref={pnlChartRef} />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Trade Win/Loss Ratio</h3>
            {isLoading ? (
              <div className="aspect-video bg-muted rounded flex items-center justify-center">
                <Skeleton className="h-[80%] w-[80%] rounded-full" />
              </div>
            ) : (
              <div className="aspect-video">
                <canvas ref={winLossChartRef} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

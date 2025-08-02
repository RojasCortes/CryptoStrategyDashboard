import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import SimpleHome from "@/pages/simple-home";
import DebugDashboard from "@/pages/debug-dashboard";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import SettingsPage from "@/pages/settings-page";
import NotificationsPage from "@/pages/notifications-page";
import PortfolioPage from "@/pages/portfolio-page";
import StrategiesPage from "@/pages/strategies-page";
import MarketsPage from "@/pages/markets-page";
import PerformancePage from "@/pages/performance-page";
import OpportunitiesPage from "@/pages/opportunities-page";
import ChartPage from "@/pages/chart-page";
import HelpPage from "@/pages/help-page";
import CryptocurrenciesPage from "@/pages/cryptocurrencies-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/debug" component={DebugDashboard} />
      <ProtectedRoute path="/simple" component={SimpleHome} />
      <ProtectedRoute path="/" component={SimpleHome} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/portfolio" component={PortfolioPage} />
      <ProtectedRoute path="/strategies" component={StrategiesPage} />
      <ProtectedRoute path="/cryptocurrencies" component={CryptocurrenciesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/markets" component={MarketsPage} />
      <ProtectedRoute path="/performance" component={PerformancePage} />
      <ProtectedRoute path="/opportunities" component={OpportunitiesPage} />
      <ProtectedRoute path="/charts" component={ChartPage} />
      <ProtectedRoute path="/help" component={HelpPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

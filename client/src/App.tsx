import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import SettingsPage from "@/pages/settings-page";
import NotificationsPage from "@/pages/notifications-page";
import PortfolioPage from "@/pages/portfolio-page";
import StrategiesPage from "@/pages/strategies-page";
import MarketsPage from "@/pages/markets-page";
import PerformancePage from "@/pages/performance-page";
import OpportunitiesPage from "@/pages/opportunities-page";
import HelpPage from "@/pages/help-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/portfolio" component={PortfolioPage} />
      <ProtectedRoute path="/strategies" component={StrategiesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/markets" component={MarketsPage} />
      <ProtectedRoute path="/performance" component={PerformancePage} />
      <ProtectedRoute path="/opportunities" component={OpportunitiesPage} />
      <ProtectedRoute path="/help" component={HelpPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

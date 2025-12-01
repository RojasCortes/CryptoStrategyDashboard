import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { FirebaseAuthProvider } from "@/hooks/use-firebase-auth";
import { FirebaseProtectedRoute } from "@/lib/firebase-protected-route";

import NotFound from "@/pages/not-found";
import CleanDashboard from "@/pages/clean-dashboard";
import FirebaseAuthPage from "@/pages/firebase-auth-page";
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
      <FirebaseProtectedRoute path="/" component={CleanDashboard} />
      <FirebaseProtectedRoute path="/portfolio" component={PortfolioPage} />
      <FirebaseProtectedRoute path="/strategies" component={StrategiesPage} />
      <FirebaseProtectedRoute path="/cryptocurrencies" component={CryptocurrenciesPage} />
      <FirebaseProtectedRoute path="/settings" component={SettingsPage} />
      <FirebaseProtectedRoute path="/notifications" component={NotificationsPage} />
      <FirebaseProtectedRoute path="/markets" component={MarketsPage} />
      <FirebaseProtectedRoute path="/performance" component={PerformancePage} />
      <FirebaseProtectedRoute path="/opportunities" component={OpportunitiesPage} />
      <FirebaseProtectedRoute path="/charts" component={ChartPage} />
      <FirebaseProtectedRoute path="/help" component={HelpPage} />
      <Route path="/auth" component={FirebaseAuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <FirebaseAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

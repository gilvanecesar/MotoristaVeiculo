import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider as UserAuthProvider } from "@/hooks/use-auth";
import { AuthProvider as ClientAuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { ClientRegistrationCheck } from "@/components/client-registration-check";

import NotFound from "@/pages/not-found";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page-fixed";
import DriversPage from "@/pages/drivers/index";
import DriverForm from "@/pages/drivers/driver-form";
import VehiclesPage from "@/pages/vehicles/index";
import ReportsPage from "@/pages/reports";
import FreightsPage from "@/pages/freights/index";
import FreightForm from "@/pages/freights/freight-form";
import ClientsPage from "@/pages/clients/index";
import ClientForm from "@/pages/clients/client-form";
import AdminPage from "@/pages/admin/index";
import FinanceDashboard from "@/pages/admin/finance/index";
import FinanceSettings from "@/pages/admin/finance/settings";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCancelPage from "@/pages/payment-cancel";
import CheckoutPage from "@/pages/checkout";
import SubscribePage from "@/pages/subscribe";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/drivers" component={DriversPage} />
      <ProtectedRoute path="/drivers/new" component={DriverForm} />
      <ProtectedRoute path="/drivers/:id" component={DriverForm} />
      <ProtectedRoute path="/vehicles" component={VehiclesPage} />
      <ProtectedRoute path="/freights" component={FreightsPage} />
      <ProtectedRoute path="/freights/new" component={FreightForm} />
      <ProtectedRoute path="/freights/:id" component={FreightForm} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/new" component={ClientForm} />
      <ProtectedRoute path="/clients/:id" component={ClientForm} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/finance" component={FinanceDashboard} />
      <ProtectedRoute path="/admin/finance/settings" component={FinanceSettings} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-cancel" component={PaymentCancelPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/subscribe" component={SubscribePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserAuthProvider>
          <ClientAuthProvider>
            <ClientRegistrationCheck />
            <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
              <Navigation />
              <div className="flex flex-col flex-grow">
                <main className="px-6 py-6 flex-grow max-w-full overflow-x-hidden">
                  <div className="container mx-auto">
                    <Router />
                  </div>
                </main>
                <Footer />
              </div>
            </div>
            <Toaster />
          </ClientAuthProvider>
        </UserAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

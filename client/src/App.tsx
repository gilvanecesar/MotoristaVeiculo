import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider as UserAuthProvider } from "@/hooks/use-auth";
import { AuthProvider as ClientAuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { ClientRegistrationCheck } from "@/components/client-registration-check";
import { SubscriptionStatusBanner } from "@/components/ui/subscription-status-banner";

import NotFound from "@/pages/not-found";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import LoginPage from "@/pages/login-page";
import LandingPage from "@/pages/landing/index";
import DriversPage from "@/pages/drivers/index";
import DriverForm from "@/pages/drivers/driver-form";
import VehiclesPage from "@/pages/vehicles/index";
import ReportsPage from "@/pages/reports";
import FreightsPage from "@/pages/freights/index";
import FreightForm from "@/pages/freights/freight-form";
import FreightDetailPage from "@/pages/freights/[id]";
import ClientsPage from "@/pages/clients/index";
import ClientForm from "@/pages/clients/client-form";
import AdminPage from "@/pages/admin/index";
import FinanceDashboard from "@/pages/admin/finance/index";
import FinanceSettings from "@/pages/admin/finance/settings";
import AdminUsersPage from "@/pages/admin/users/index";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCancelPage from "@/pages/payment-cancel";
import CheckoutPage from "@/pages/checkout";
import SubscribePage from "@/pages/subscribe";
import ProfileSelectionPage from "@/pages/profile-selection";
import ResetPasswordPage from "@/pages/reset-password";
import SettingsPage from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={LoginPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-cancel" component={PaymentCancelPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/subscribe" component={SubscribePage} />
      <ProtectedRoute path="/profile-selection" component={ProfileSelectionPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/drivers" component={DriversPage} />
      <ProtectedRoute path="/drivers/new" component={DriverForm} />
      <ProtectedRoute path="/drivers/:id" component={DriverForm} />
      <ProtectedRoute path="/vehicles" component={VehiclesPage} />
      <ProtectedRoute path="/freights" component={FreightsPage} />
      <ProtectedRoute path="/freights/new" component={FreightForm} />
      <ProtectedRoute path="/freights/:id/edit" component={() => <FreightForm isEditMode={true} />} />
      <ProtectedRoute path="/freights/:id" component={FreightDetailPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/new" component={ClientForm} />
      <ProtectedRoute path="/clients/:id" component={ClientForm} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/finance" component={FinanceDashboard} />
      <ProtectedRoute path="/admin/finance/settings" component={FinanceSettings} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/home" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLandingPage = location === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserAuthProvider>
          <ClientAuthProvider>
            <ClientRegistrationCheck />
            <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
              {!isLandingPage && <Navigation />}
              <SubscriptionStatusBanner />
              <div className={`flex flex-col flex-grow ${isLandingPage ? 'px-0 py-0' : ''}`}>
                <main className={`
                  ${isLandingPage ? 'p-0' : 'px-3 sm:px-6 py-4 sm:py-6 pb-20 md:pb-6'} 
                  flex-grow max-w-full overflow-x-hidden
                `}>
                  <div className={`${isLandingPage ? 'w-full max-w-full' : 'container mx-auto'}`}>
                    <Router />
                  </div>
                </main>
                {!isLandingPage && <Footer className="hidden md:block" />}
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

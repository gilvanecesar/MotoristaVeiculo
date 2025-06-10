import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider as UserAuthProvider } from "@/hooks/use-auth";
import { AuthProvider as ClientAuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
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

import ReportsPage from "@/pages/reports";
import FreightsPage from "@/pages/freights/index";
import FreightForm from "@/pages/freights/freight-form";
import FreightDetailPage from "@/pages/freights/[id]";
import SimpleFreightForm from "@/pages/freights/simple-freight-form";
import SimpleFreightEdit from "@/pages/freights/simple-edit";
import ValorFreteEdit from "@/pages/freights/valor-edit";
import DirectFreightEdit from "@/pages/freights/direct-edit";
import BasicCreateFreight from "@/pages/freights/basic-create";
import ClientsPage from "@/pages/clients/index";
import ClientForm from "@/pages/clients/client-form";
import ComplementsPage from "@/pages/complements/index";
import CreateComplementPage from "@/pages/complements/create";
import ComplementDetailPage from "@/pages/complements/[id]";
import EditComplementPage from "@/pages/complements/[id]/edit";
import AdminPage from "@/pages/admin/index";
import FinanceDashboard from "@/pages/admin/finance/index";
import FinanceSettings from "@/pages/admin/finance/settings";
import AdminUsersPage from "@/pages/admin/users/index";
import EmailAdminPage from "@/pages/admin/email/index";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCancelPage from "@/pages/payment-cancel";
import CheckoutPage from "@/pages/checkout";
import SubscribePage from "@/pages/subscribe";
import SubscribePlansPage from "@/pages/subscribe/plans";
import SubscribeFixedPage from "@/pages/subscribe/fixed";
import InvoicesPage from "@/pages/invoices";
import InvoicesFixedPage from "@/pages/invoices/fixed";
import SubscriptionHistoryFixedPage from "@/pages/subscription-history/fixed";
import PaymentHistoryPage from "@/pages/user/payment-history";
import ProfileSelectionPage from "@/pages/profile-selection";
import ResetPasswordPage from "@/pages/reset-password";
import SettingsPage from "@/pages/settings";
import PublicFreight from "@/pages/public-freight";
import PublicComplement from "@/pages/public/complement";
import WebhookConfig from "@/pages/webhook-config";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/freight/:id" component={PublicFreight} />
      <Route path="/public/complements/:id" component={PublicComplement} />
      <ProtectedRoute path="/home" component={Home} />
      <Route path="/auth" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-cancel" component={PaymentCancelPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/subscribe" component={SubscribePage} />
      <ProtectedRoute path="/subscribe/plans" component={SubscribePlansPage} />
      <ProtectedRoute path="/subscribe/fixed" component={SubscribeFixedPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/invoices/fixed" component={InvoicesFixedPage} />
      <ProtectedRoute path="/subscription-history/fixed" component={SubscriptionHistoryFixedPage} />
      <ProtectedRoute path="/user/payment-history" component={PaymentHistoryPage} />
      <ProtectedRoute path="/profile-selection" component={ProfileSelectionPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/drivers" component={DriversPage} />
      <ProtectedRoute path="/drivers/new" component={DriverForm} />
      <ProtectedRoute path="/drivers/:id" component={DriverForm} />
      <ProtectedRoute path="/vehicles" component={VehiclesPage} />
      <ProtectedRoute path="/vehicles/new" component={VehicleForm} />
      <ProtectedRoute path="/vehicles/:id" component={VehicleForm} />
      <ProtectedRoute path="/freights" component={FreightsPage} />
      <ProtectedRoute path="/freights/new" component={FreightForm} />
      <ProtectedRoute path="/freights/:id/edit" component={() => <FreightForm isEditMode={true} />} />
      <ProtectedRoute path="/freights/simple-edit/:id" component={SimpleFreightEdit} />
      <ProtectedRoute path="/freights/valor-edit/:id" component={ValorFreteEdit} />
      <ProtectedRoute path="/freights/direct-edit/:id" component={DirectFreightEdit} />
      <ProtectedRoute path="/freights/:id" component={FreightDetailPage} />
      <Route path="/teste-checkbox" component={SimpleFreightForm} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/new" component={ClientForm} />
      <ProtectedRoute path="/clients/:id" component={ClientForm} />
      <ProtectedRoute path="/complements" component={ComplementsPage} />
      <ProtectedRoute path="/complements/create" component={CreateComplementPage} />
      <ProtectedRoute path="/complements/:id/edit" component={EditComplementPage} />
      <ProtectedRoute path="/complements/:id" component={ComplementDetailPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/finance" component={FinanceDashboard} />
      <AdminRoute path="/admin/finance/settings" component={FinanceSettings} />
      <AdminRoute path="/admin/users" component={AdminUsersPage} />
      <AdminRoute path="/admin/email" component={EmailAdminPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/webhook-config" component={WebhookConfig} />
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

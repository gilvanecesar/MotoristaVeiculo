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
import AppLayout from "@/components/layout/app-layout";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import LoginPage from "@/pages/login-page";
import ProfileSelection from "@/pages/profile-selection";
import LandingPage from "@/pages/landing/index";
import DriversPage from "@/pages/drivers/index";
import DriverForm from "@/pages/drivers/driver-form";
import VehiclesPage from "@/pages/vehicles/index";
import VehicleForm from "@/pages/vehicles/vehicle-form";
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
import UserSearchPage from "@/pages/admin/user-search";
import EmailAdminPage from "@/pages/admin/email/index";
import AdminWebhooksPage from "@/pages/admin/webhooks/index";
import AdminOpenPixPage from "@/pages/admin/openpix/index";
import AdminWhatsAppPage from "@/pages/admin/whatsapp";
import AdminWhatsAppConfigPage from "@/pages/admin/whatsapp-config";
import AdminN8nConfigPage from "@/pages/admin/n8n-config";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCancelPage from "@/pages/payment-cancel";
import CheckoutPage from "@/pages/checkout";
import SubscribePage from "@/pages/subscribe";
import TestPayment from "@/pages/test-payment";
import SubscribePlansPage from "@/pages/subscribe/plans";

import InvoicesPage from "@/pages/invoices";
import InvoicesFixedPage from "@/pages/invoices/fixed";
import SubscriptionHistoryFixedPage from "@/pages/subscription-history/fixed";
import PaymentHistoryPage from "@/pages/user/payment-history";
import ProfileSelectionPage from "@/pages/profile-selection";
import SubscriptionStatusPage from "@/pages/subscription-status";
import ResetPasswordPage from "@/pages/reset-password";
import SettingsPage from "@/pages/settings";
import PublicFreight from "@/pages/public-freight";
import PublicComplement from "@/pages/public/complement";
import WebhookConfig from "@/pages/admin/webhook-config";
import UserWebhookConfig from "@/pages/webhook-config";
import MyFreightsPage from "@/pages/my-freights";
import QuotesPage from "@/pages/quotes/index";
import CreateQuotePage from "@/pages/quotes/create";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/freight/:id" component={PublicFreight} />
      <Route path="/public/complements/:id" component={PublicComplement} />
      <ProtectedRoute path="/home" component={Home} />
      <Route path="/auth" component={ProfileSelection} />
      <Route path="/login" component={LoginPage} />
      <Route path="/profile-selection" component={ProfileSelection} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-cancel" component={PaymentCancelPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/test-payment" component={TestPayment} />
      <ProtectedRoute path="/subscribe" component={SubscribePage} />
      <ProtectedRoute path="/subscribe/plans" component={SubscribePlansPage} />
      <ProtectedRoute path="/subscription-status" component={SubscriptionStatusPage} />
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
      <ProtectedRoute path="/my-freights" component={MyFreightsPage} />
      <Route path="/teste-checkbox" component={SimpleFreightForm} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/new" component={ClientForm} />
      <ProtectedRoute path="/clients/:id" component={ClientForm} />
      <ProtectedRoute path="/complements" component={ComplementsPage} />
      <ProtectedRoute path="/complements/create" component={CreateComplementPage} />
      <ProtectedRoute path="/complements/:id/edit" component={EditComplementPage} />
      <ProtectedRoute path="/complements/:id" component={ComplementDetailPage} />
      <ProtectedRoute path="/quotes" component={QuotesPage} />
      <ProtectedRoute path="/quotes/create" component={CreateQuotePage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/finance" component={FinanceDashboard} />
      <ProtectedRoute path="/admin/finance/settings" component={FinanceSettings} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <ProtectedRoute path="/admin/user-search" component={UserSearchPage} />
      <ProtectedRoute path="/admin/email" component={EmailAdminPage} />
      <ProtectedRoute path="/admin/webhooks" component={AdminWebhooksPage} />
      <ProtectedRoute path="/admin/whatsapp" component={AdminWhatsAppConfigPage} />
      <ProtectedRoute path="/admin/n8n" component={AdminN8nConfigPage} />
      <ProtectedRoute path="/admin/openpix" component={AdminOpenPixPage} />
      <ProtectedRoute path="/admin/webhook-config" component={WebhookConfig} />
      <ProtectedRoute path="/webhook-config" component={UserWebhookConfig} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/home" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  const isAuthPage = location === "/auth" || location === "/login" || location === "/reset-password";
  const isCheckoutPage = location === "/checkout";
  const isPublicPage = isLandingPage || isAuthPage || isCheckoutPage || location.startsWith("/freight/") || location.startsWith("/public/");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserAuthProvider>
          <ClientAuthProvider>
            {/* Páginas públicas sem layout */}
            {isPublicPage ? (
              <div className="min-h-screen bg-background">
                <Router />
                <Toaster />
              </div>
            ) : (
              /* Páginas protegidas com layout sidebar */
              <AppLayout>
                <ClientRegistrationCheck />
                <Router />
                <Toaster />
              </AppLayout>
            )}
            
          </ClientAuthProvider>
        </UserAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

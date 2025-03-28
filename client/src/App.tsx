import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./lib/theme-provider";
import { AuthProvider } from "./lib/auth-context";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import DriversPage from "@/pages/drivers/index";
import DriverForm from "@/pages/drivers/driver-form";
import VehiclesPage from "@/pages/vehicles/index";
import ReportsPage from "@/pages/reports";
import FreightsPage from "@/pages/freights/index";
import FreightForm from "@/pages/freights/freight-form";
import ClientsPage from "@/pages/clients/index";
import ClientForm from "@/pages/clients/client-form";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/drivers" component={DriversPage} />
      <Route path="/drivers/new" component={DriverForm} />
      <Route path="/drivers/:id" component={DriverForm} />
      <Route path="/vehicles" component={VehiclesPage} />
      <Route path="/freights" component={FreightsPage} />
      <Route path="/freights/new" component={FreightForm} />
      <Route path="/freights/:id" component={FreightForm} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/clients/new" component={ClientForm} />
      <Route path="/clients/:id" component={ClientForm} />
      <Route path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
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
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

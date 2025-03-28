import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/drivers" component={DriversPage} />
      <Route path="/drivers/new" component={DriverForm} />
      <Route path="/drivers/:id" component={DriverForm} />
      <Route path="/vehicles" component={VehiclesPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex flex-col flex-grow">
          <Header />
          <main className="px-6 py-6 flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;

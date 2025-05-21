import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import SimpleFreightForm from "@/pages/freights/simple-freight-form";

function Router() {
  return (
    <Switch>
      <Route path="/teste-checkbox" component={SimpleFreightForm} />
      <Route>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Teste de Checkbox</h1>
            <p className="mb-4">Esta é uma versão simplificada para testar a funcionalidade dos checkboxes.</p>
            <a href="/teste-checkbox" className="text-blue-500 hover:underline">
              Ir para o teste de checkbox
            </a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <div className="flex flex-col flex-grow">
            <main className="px-3 sm:px-6 py-4 sm:py-6 pb-20 md:pb-6 flex-grow max-w-full overflow-x-hidden">
              <div className="container mx-auto">
                <Router />
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
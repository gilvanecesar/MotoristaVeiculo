import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Building2 } from "lucide-react";

export default function UserTypeSelection() {
  const [, navigate] = useLocation();

  const handleTypeSelection = (type: "motorista" | "empresa") => {
    navigate(`/auth/register?type=${type}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-900 dark:text-white">
          Vamos lá, o que deseja fazer?
        </h1>

        <div className="space-y-4">
          {/* Opção Caminhoneiro */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-primary"
            onClick={() => handleTypeSelection("motorista")}
            data-testid="button-select-driver"
          >
            <CardContent className="flex items-center p-6 md:p-8">
              <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 mr-6">
                <Truck className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
                  Sou Caminhoneiro
                </h2>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300">
                  Aqui você encontra e negocia as melhores opções de fretes em todo o Brasil.
                </p>
              </div>
              <div className="ml-4">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Opção Empresa */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-primary"
            onClick={() => handleTypeSelection("empresa")}
            data-testid="button-select-company"
          >
            <CardContent className="flex items-center p-6 md:p-8">
              <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 mr-6">
                <Building2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
                  Sou Empresa
                </h2>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300">
                  Aqui você anuncia seus fretes para encontrar motoristas de forma rápida e segura.
                </p>
              </div>
              <div className="ml-4">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Já tem uma conta?
          </p>
          <button
            onClick={() => navigate("/auth/login")}
            className="text-primary hover:underline font-medium"
            data-testid="link-login"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
}

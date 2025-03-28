import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, TrendingUp, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">Visão geral do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Motoristas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">
                {isLoadingDrivers ? "..." : drivers?.length || 0}
              </div>
            </div>
            <Link href="/drivers">
              <p className="text-xs text-primary mt-2 underline underline-offset-2 cursor-pointer">
                Ver todos
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">
                {isLoadingVehicles ? "..." : vehicles?.length || 0}
              </div>
            </div>
            <Link href="/vehicles">
              <p className="text-xs text-primary mt-2 underline underline-offset-2 cursor-pointer">
                Ver todos
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Média de Veículos/Motorista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">
                {isLoadingDrivers || isLoadingVehicles
                  ? "..."
                  : drivers?.length && vehicles?.length
                  ? (vehicles.length / drivers.length).toFixed(1)
                  : "0"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Motoristas sem Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">
                {isLoadingDrivers
                  ? "..."
                  : drivers?.filter(d => !d.vehicles || d.vehicles.length === 0)?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Dashboard</h3>
        <p className="text-slate-600">
          Este é o painel de controle do seu sistema de gestão de motoristas e veículos.
          <br />
          Utilize o menu de navegação para acessar os diferentes módulos do sistema.
        </p>
      </div>
    </div>
  );
}

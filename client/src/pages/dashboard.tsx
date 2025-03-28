import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, TrendingUp, AlertCircle, Map, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["/api/vehicles"],
  });
  
  const { data: freights, isLoading: isLoadingFreights } = useQuery({
    queryKey: ["/api/freights"],
  });
  
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Dados agrupados para o gráfico de fretes por estado
  const freightsByState = useMemo(() => {
    if (!freights || isLoadingFreights) return [];
    
    // Usamos um objeto regular em vez de Map
    const statesMap = {};
    
    // Adiciona estados de origem
    if (Array.isArray(freights)) {
      freights.forEach(freight => {
        if (!freight.originState) return;
        const state = freight.originState;
        statesMap[state] = (statesMap[state] || 0) + 1;
      });
      
      // Adiciona estados de destino (incluindo destinos múltiplos)
      freights.forEach(freight => {
        // Se tiver destinos múltiplos
        if (freight.hasMultipleDestinations && freight.destinations && freight.destinations.length > 0) {
          freight.destinations.forEach(dest => {
            if (!dest || !dest.state) return;
            const state = dest.state;
            statesMap[state] = (statesMap[state] || 0) + 1;
          });
        } else {
          // Destino único
          if (!freight.destinationState) return;
          const state = freight.destinationState;
          statesMap[state] = (statesMap[state] || 0) + 1;
        }
      });
    }
    
    // Converte o objeto para um array para uso no Recharts, excluindo undefined e null
    return Object.entries(statesMap)
      .filter(([state]) => state && state !== "undefined" && state !== "null")
      .map(([state, count]) => ({ 
        state, 
        count,
        fill: getRandomColor(state) // Cor baseada no estado
      }))
      .sort((a, b) => b.count - a.count); // Ordenamos por contagem decrescente
  }, [freights, isLoadingFreights]);
  
  // Função para gerar cores consistentes para cada estado
  function getRandomColor(state) {
    const colors = {
      'SP': '#8884d8',
      'RJ': '#83a6ed',
      'MG': '#8dd1e1',
      'ES': '#82ca9d',
      'PR': '#a4de6c',
      'SC': '#d0ed57',
      'RS': '#ffc658',
      'MS': '#ff8042',
      'MT': '#0088FE',
      'GO': '#00C49F',
      'DF': '#FFBB28',
      'BA': '#FF8042',
      'CE': '#8884d8',
      'PE': '#82ca9d',
      'AL': '#ffc658',
      'SE': '#83a6ed',
      'PB': '#8dd1e1',
      'RN': '#a4de6c',
      'PI': '#d0ed57',
      'MA': '#ff8042',
      'PA': '#0088FE',
      'AM': '#00C49F',
      'RO': '#FFBB28',
      'RR': '#FF8042',
      'AP': '#8884d8',
      'AC': '#82ca9d',
      'TO': '#ffc658'
    };
    
    return colors[state] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
  }
  
  // Para formatar o nome dos estados no tooltip
  const formatStateName = (state) => {
    if (!state) return "Não definido";
    
    const stateNames = {
      'SP': 'São Paulo',
      'RJ': 'Rio de Janeiro',
      'MG': 'Minas Gerais',
      'ES': 'Espírito Santo',
      'PR': 'Paraná',
      'SC': 'Santa Catarina',
      'RS': 'Rio Grande do Sul',
      'MS': 'Mato Grosso do Sul',
      'MT': 'Mato Grosso',
      'GO': 'Goiás',
      'DF': 'Distrito Federal',
      'BA': 'Bahia',
      'CE': 'Ceará',
      'PE': 'Pernambuco',
      'AL': 'Alagoas',
      'SE': 'Sergipe',
      'PB': 'Paraíba',
      'RN': 'Rio Grande do Norte',
      'PI': 'Piauí',
      'MA': 'Maranhão',
      'PA': 'Pará',
      'AM': 'Amazonas',
      'RO': 'Rondônia',
      'RR': 'Roraima',
      'AP': 'Amapá',
      'AC': 'Acre',
      'TO': 'Tocantins'
    };
    
    return stateNames[state] || state;
  };

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
                  : Array.isArray(drivers) && Array.isArray(vehicles) && drivers.length > 0
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
                  : Array.isArray(drivers)
                    ? drivers.filter(d => !d.vehicles || d.vehicles.length === 0).length
                    : 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Fretes por Estados */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-medium">Fretes por Estados</CardTitle>
            </div>
            <CardDescription>
              Distribuição de fretes por estados brasileiros (origens e destinos)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {isLoadingFreights ? (
              <div className="flex items-center justify-center h-full">
                <p>Carregando dados...</p>
              </div>
            ) : freightsByState.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p>Nenhum dado disponível</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Gráfico de Barras */}
                <div className="w-full md:w-2/3 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={freightsByState}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis
                        dataKey="state"
                        type="category"
                        width={40}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value, name, props) => [value, 'Fretes']}
                        labelFormatter={(label) => formatStateName(label)}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {freightsByState.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de Pizza */}
                <div className="w-full md:w-1/3 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={freightsByState}
                        dataKey="count"
                        nameKey="state"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => entry.state}
                      >
                        {freightsByState.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [value, 'Fretes']}
                        labelFormatter={(label) => formatStateName(label)}
                      />
                      <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Estatísticas de Fretes */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium text-slate-700">Total de Fretes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {isLoadingFreights ? "..." : Array.isArray(freights) ? freights.length : 0}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm">
                <span className="font-medium">Fretes Abertos: </span>
                {isLoadingFreights ? "..." : 
                  Array.isArray(freights) ? freights.filter(f => f.status === "aberto").length : 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Em Andamento: </span>
                {isLoadingFreights ? "..." : 
                  Array.isArray(freights) ? freights.filter(f => f.status === "em_andamento").length : 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Concluídos: </span>
                {isLoadingFreights ? "..." : 
                  Array.isArray(freights) ? freights.filter(f => f.status === "concluido").length : 0}
              </div>
            </div>
            <Link href="/freights">
              <p className="text-xs text-primary mt-3 underline underline-offset-2 cursor-pointer">
                Gerenciar fretes
              </p>
            </Link>
          </CardContent>
        </Card>
        
        {/* Informações Gerais do Sistema */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {isLoadingClients ? "..." : Array.isArray(clients) ? clients.length : 0}
            </div>
            <p className="text-sm text-slate-600">
              {isLoadingClients 
                ? "Carregando informações..." 
                : `${Array.isArray(clients) ? clients.length : 0} clientes ativos no sistema`}
            </p>
            <Link href="/clients">
              <p className="text-xs text-primary mt-3 underline underline-offset-2 cursor-pointer">
                Gerenciar clientes
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Users, Car, TrendingUp, AlertCircle, MapPin, Truck, DollarSign, Calendar, Filter, Download, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Treemap
} from "recharts";
import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const isMobile = useIsMobile();
  
  // Estados para filtros
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  
  // Queries para dados
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

  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["/api/quotes"],
  });

  const { data: publicStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/public/stats"],
  });

  // Cálculos de estatísticas avançadas
  const dashboardStats = useMemo(() => {
    const totalDrivers = drivers?.length || 0;
    const totalVehicles = vehicles?.length || 0;
    const totalFreights = freights?.length || 0;
    const totalClients = clients?.length || 0;
    const totalQuotes = quotes?.length || 0;
    
    // Cálculo de eficiência
    const efficiency = totalDrivers > 0 ? ((totalVehicles / totalDrivers) * 100) : 0;
    
    // Fretes ativos
    const activeFreights = freights?.filter(f => f.status === 'ativo' || f.status === 'em_andamento')?.length || 0;
    const activeFreightsPercent = totalFreights > 0 ? (activeFreights / totalFreights) * 100 : 0;
    
    // Cotações ativas
    const activeQuotes = quotes?.filter(q => q.status === 'ativa' || q.status === 'pendente')?.length || 0;
    const activeQuotesPercent = totalQuotes > 0 ? (activeQuotes / totalQuotes) * 100 : 0;
    
    // Motoristas sem veículos
    const driversWithoutVehicles = drivers?.filter(d => !d.vehicles || d.vehicles.length === 0)?.length || 0;
    const driversWithoutVehiclesPercent = totalDrivers > 0 ? (driversWithoutVehicles / totalDrivers) * 100 : 0;
    
    return {
      totalDrivers,
      totalVehicles,
      totalFreights,
      totalClients,
      totalQuotes,
      efficiency,
      activeFreights,
      activeFreightsPercent,
      activeQuotes,
      activeQuotesPercent,
      driversWithoutVehicles,
      driversWithoutVehiclesPercent,
      utilizationRate: totalVehicles > 0 ? (activeFreights / totalVehicles) * 100 : 0,
      conversionRate: totalQuotes > 0 ? ((totalFreights / totalQuotes) * 100) : 0
    };
  }, [drivers, vehicles, freights, clients, quotes]);

  // Dados para gráfico de fretes por estado (com percentual)
  const freightsByState = useMemo(() => {
    if (!freights || isLoadingFreights) return [];
    
    const statesMap = {};
    const totalFreights = freights.length;
    
    freights.forEach(freight => {
      if (freight.originState) {
        const state = freight.originState;
        statesMap[state] = (statesMap[state] || 0) + 1;
      }
      
      if (freight.hasMultipleDestinations && freight.destinations) {
        freight.destinations.forEach(dest => {
          if (dest?.state) {
            const state = dest.state;
            statesMap[state] = (statesMap[state] || 0) + 1;
          }
        });
      } else if (freight.destinationState) {
        const state = freight.destinationState;
        statesMap[state] = (statesMap[state] || 0) + 1;
      }
    });
    
    return Object.entries(statesMap)
      .filter(([state]) => state && state !== "undefined")
      .map(([state, count]) => ({ 
        state, 
        count,
        percentage: totalFreights > 0 ? ((count / totalFreights) * 100).toFixed(1) : 0,
        fill: getStateColor(state)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 estados
  }, [freights, isLoadingFreights]);

  // Dados para gráfico de performance mensal
  const monthlyPerformance = useMemo(() => {
    const data = [];
    const months = 6; // Últimos 6 meses
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthFreights = freights?.filter(f => {
        const createdAt = new Date(f.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      })?.length || 0;
      
      const monthQuotes = quotes?.filter(q => {
        const createdAt = new Date(q.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      })?.length || 0;
      
      data.push({
        month: format(date, 'MMM', { locale: ptBR }),
        fretes: monthFreights,
        cotacoes: monthQuotes,
        conversao: monthQuotes > 0 ? ((monthFreights / monthQuotes) * 100).toFixed(1) : 0
      });
    }
    
    return data;
  }, [freights, quotes]);

  // Dados para gráfico de distribuição de tipos de veículos
  const vehicleTypes = useMemo(() => {
    if (!vehicles || isLoadingVehicles) return [];
    
    const typesMap = {};
    const totalVehicles = vehicles.length;
    
    vehicles.forEach(vehicle => {
      const type = vehicle.type || 'Não especificado';
      typesMap[type] = (typesMap[type] || 0) + 1;
    });
    
    return Object.entries(typesMap)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalVehicles > 0 ? ((count / totalVehicles) * 100).toFixed(1) : 0,
        fill: getVehicleTypeColor(type)
      }))
      .sort((a, b) => b.count - a.count);
  }, [vehicles, isLoadingVehicles]);

  // Dados para gráfico de status de fretes
  const freightStatus = useMemo(() => {
    if (!freights || isLoadingFreights) return [];
    
    const statusMap = {
      'ativo': 0,
      'em_andamento': 0,
      'concluido': 0,
      'cancelado': 0,
      'pendente': 0
    };
    
    const totalFreights = freights.length;
    
    freights.forEach(freight => {
      const status = freight.status || 'pendente';
      if (statusMap.hasOwnProperty(status)) {
        statusMap[status]++;
      } else {
        statusMap['pendente']++;
      }
    });
    
    return Object.entries(statusMap)
      .map(([status, count]) => ({
        status: formatStatusName(status),
        count,
        percentage: totalFreights > 0 ? ((count / totalFreights) * 100).toFixed(1) : 0,
        fill: getStatusColor(status)
      }))
      .filter(item => item.count > 0);
  }, [freights, isLoadingFreights]);

  // Funções auxiliares para cores
  function getStateColor(state) {
    const colors = {
      'SP': '#8884d8', 'RJ': '#83a6ed', 'MG': '#8dd1e1', 'ES': '#82ca9d',
      'PR': '#a4de6c', 'SC': '#d0ed57', 'RS': '#ffc658', 'MS': '#ff8042',
      'MT': '#0088FE', 'GO': '#00C49F', 'DF': '#FFBB28', 'BA': '#FF8042'
    };
    return colors[state] || '#8884d8';
  }

  function getVehicleTypeColor(type) {
    const colors = {
      'Caminhão': '#8884d8',
      'Van': '#83a6ed',
      'Carreta': '#82ca9d',
      'Bitrem': '#ffc658',
      'Toco': '#ff8042',
      'Truck': '#00C49F'
    };
    return colors[type] || '#8884d8';
  }

  function getStatusColor(status) {
    const colors = {
      'ativo': '#00C49F',
      'em_andamento': '#8884d8',
      'concluido': '#82ca9d',
      'cancelado': '#ff8042',
      'pendente': '#ffc658'
    };
    return colors[status] || '#8884d8';
  }

  function formatStatusName(status) {
    const names = {
      'ativo': 'Ativo',
      'em_andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado',
      'pendente': 'Pendente'
    };
    return names[status] || status;
  }

  // Função para refrescar dados
  const refreshData = () => {
    window.location.reload();
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden p-2 md:p-6 space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Executiva</h1>
          <p className="text-sm text-gray-600">Análise completa de performance e indicadores</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="freights">Fretes</SelectItem>
              <SelectItem value="quotes">Cotações</SelectItem>
              <SelectItem value="drivers">Motoristas</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refreshData} className="w-full md:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Motoristas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{dashboardStats.totalDrivers}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {dashboardStats.driversWithoutVehiclesPercent.toFixed(1)}% sem veículos
              </Badge>
            </div>
            <Progress value={100 - dashboardStats.driversWithoutVehiclesPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Veículos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{dashboardStats.totalVehicles}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {dashboardStats.utilizationRate.toFixed(1)}% em uso
              </Badge>
            </div>
            <Progress value={dashboardStats.utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Fretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{dashboardStats.totalFreights}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {dashboardStats.activeFreightsPercent.toFixed(1)}% ativos
              </Badge>
            </div>
            <Progress value={dashboardStats.activeFreightsPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cotações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{dashboardStats.totalQuotes}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {dashboardStats.conversionRate.toFixed(1)}% conversão
              </Badge>
            </div>
            <Progress value={dashboardStats.conversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
            <CardDescription>Fretes vs Cotações com taxa de conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyPerformance}>
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="fretes" fill="#8884d8" name="Fretes" />
                <Bar yAxisId="left" dataKey="cotacoes" fill="#82ca9d" name="Cotações" />
                <Line yAxisId="right" type="monotone" dataKey="conversao" stroke="#ff7300" name="Conversão %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Fretes por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Estados</CardTitle>
            <CardDescription>Distribuição de fretes por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={freightsByState} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="state" type="category" width={30} />
                <Tooltip formatter={(value, name) => [`${value} fretes (${freightsByState.find(f => f.count === value)?.percentage}%)`, 'Fretes']} />
                <Bar dataKey="count">
                  {freightsByState.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status de Fretes */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Fretes</CardTitle>
            <CardDescription>Distribuição por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={freightStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {freightStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Tipos de Veículos */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Veículos</CardTitle>
            <CardDescription>Distribuição da frota por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {vehicleTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de eficiência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Taxa de Utilização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{dashboardStats.utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-emerald-600 mt-1">Veículos em uso ativo</p>
            <Progress value={dashboardStats.utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{dashboardStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-indigo-600 mt-1">Cotações → Fretes</p>
            <Progress value={dashboardStats.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-700">Eficiência da Frota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{dashboardStats.efficiency.toFixed(1)}%</div>
            <p className="text-xs text-rose-600 mt-1">Veículos por motorista</p>
            <Progress value={Math.min(dashboardStats.efficiency, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/drivers">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Motoristas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vehicles">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Veículos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/freights">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Fretes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quotes">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Cotações</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
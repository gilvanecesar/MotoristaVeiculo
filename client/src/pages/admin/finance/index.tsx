import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Calendar,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para formatação de moeda
function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }
  
  let numericValue: number;
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    numericValue = parseFloat(cleaned) || 0;
  } else {
    numericValue = Number(value) || 0;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
}

// Função para formatação de data
function formatDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return 'Data não disponível';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
}

// Interfaces para tipos de dados
interface FinanceStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  monthlyData: {
    month: string;
    revenue: number;
  }[];
  subscriptionsByStatus: {
    status: string;
    count: number;
  }[];
}

interface SubscriptionData {
  id: string;
  clientId?: number | null;
  clientName: string;
  email: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "completed";
  amount: number | string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  source?: 'openpix' | 'local';
}

interface InvoiceData {
  id: string;
  clientName: string;
  email: string;
  amount: number | string | null;
  status: "paid" | "open" | "void" | "uncollectible" | "completed";
  date: string | Date | null;
  description?: string;
}

// Componente StatusBadge
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
    completed: { label: 'Paga', variant: 'secondary' as const, icon: CheckCircle, color: 'text-green-600' },
    canceled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    past_due: { label: 'Vencida', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' },
    trialing: { label: 'Teste', variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
    paid: { label: 'Pago', variant: 'secondary' as const, icon: CheckCircle, color: 'text-green-600' },
    open: { label: 'Aberto', variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
    void: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    uncollectible: { label: 'Irrecuperável', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-gray-600'
  };

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}

// Componente principal
export default function FinancePage() {
  // Interfaces para os dados das estatísticas
  interface StatsData {
    totalRevenue: number;
    monthlyRevenue: number;
    subscriptionsByStatus: Array<{ status: string; count: number; }>;
    monthlyData: Array<{ month: string; value: number; }>;
  }

  // Queries para buscar dados da OpenPix
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<StatsData>({
    queryKey: ['/api/admin/openpix/finance/stats'],
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const { data: subscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<SubscriptionData[]>({
    queryKey: ['/api/admin/openpix/subscriptions', Date.now()],
    refetchInterval: 5000, // Reduzir para 5 segundos para testar
    staleTime: 0, // Dados sempre considerados obsoletos
    gcTime: 0 // Não cachear
  });

  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<InvoiceData[]>({
    queryKey: ['/api/admin/openpix/invoices'],
    refetchInterval: 30000
  });

  const isLoading = statsLoading || subscriptionsLoading || invoicesLoading;

  // Função para refresh manual com invalidação de cache
  const handleRefresh = () => {
    console.log('🔄 [FRONTEND] Forçando refresh dos dados...');
    refetchStats();
    refetchSubscriptions();
    refetchInvoices();
  };

  // Cálculos baseados em dados reais
  const totalSubscriptions = Array.isArray(subscriptions) ? subscriptions.length : 0;
  const activeSubscriptions = Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionData) => 
    sub.status === 'active' || sub.status === 'completed'
  ).length : 0;
  
  const totalRevenue = stats?.totalRevenue || 0;
  const monthlyRevenue = stats?.monthlyRevenue || 0;
  
  const revenueGrowth = totalRevenue > 0 ? ((monthlyRevenue / totalRevenue) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Dados em tempo real da OpenPix • Atualização automática a cada 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            OpenPix Live
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(monthlyRevenue)} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              de {totalSubscriptions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            {revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Comparado ao total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(invoices) ? invoices.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              Faturas processadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Assinaturas</CardTitle>
                <CardDescription>Por status atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(stats?.subscriptionsByStatus) ? stats.subscriptionsByStatus.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.status}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(item.count / totalSubscriptions) * 100} 
                        className="w-[100px]" 
                      />
                      <span className="text-sm text-muted-foreground w-8">
                        {item.count}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Receita Mensal */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Mês</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.isArray(stats?.monthlyData) ? stats.monthlyData.slice(-6).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.month}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Rápido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Sistema</CardTitle>
              <CardDescription>Status atual da OpenPix integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalRevenue > 0 ? '✓' : '○'}</div>
                  <div className="text-sm font-medium">Integração OpenPix</div>
                  <div className="text-xs text-muted-foreground">
                    {totalRevenue > 0 ? 'Ativa' : 'Sem dados'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{Array.isArray(subscriptions) ? subscriptions.length : 0}</div>
                  <div className="text-sm font-medium">Total Assinaturas</div>
                  <div className="text-xs text-muted-foreground">
                    OpenPix + Local
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Array.isArray(invoices) ? invoices.length : 0}</div>
                  <div className="text-sm font-medium">Faturas Processadas</div>
                  <div className="text-xs text-muted-foreground">
                    Este mês
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Assinaturas */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Ativas</CardTitle>
              <CardDescription>
                Dados combinados: OpenPix + Banco Local • {subscriptions?.length || 0} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(subscriptions) ? subscriptions.map((subscription: SubscriptionData) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.clientName}</div>
                          <div className="text-xs text-muted-foreground">{subscription.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {subscription.plan === 'monthly' ? 'Mensal' : 
                           subscription.plan === 'annual' ? 'Anual' : 
                           subscription.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={subscription.status} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(subscription.amount)}
                      </TableCell>
                      <TableCell>{formatDate(subscription.startDate)}</TableCell>
                      <TableCell>{formatDate(subscription.endDate)}</TableCell>
                      <TableCell>
                        {subscription.source === 'openpix' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            OpenPix
                          </Badge>
                        )}
                        {subscription.source === 'local' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Local
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Nenhuma assinatura encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Faturas */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Recentes</CardTitle>
              <CardDescription>
                Dados da OpenPix • {invoices?.length || 0} faturas processadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(invoices) ? invoices.map((invoice: InvoiceData) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">
                        {invoice.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.clientName}</div>
                          <div className="text-xs text-muted-foreground">{invoice.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhuma fatura encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análises */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
                <CardDescription>Indicadores chave de performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                  <span className="text-sm">
                    {totalSubscriptions > 0 ? ((activeSubscriptions / totalSubscriptions) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Receita Média por Cliente</span>
                  <span className="text-sm">
                    {formatCurrency(activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Faturas Processadas</span>
                  <span className="text-sm">{invoices?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da Integração</CardTitle>
                <CardDescription>OpenPix API Status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conexão OpenPix</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Sincronização</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Atualização Automática</span>
                  <Badge variant="outline">30s</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dados Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Técnicos</CardTitle>
              <CardDescription>Informações técnicas da integração</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Fonte dos Dados</div>
                  <div className="text-xs text-muted-foreground">
                    OpenPix API v1 + PostgreSQL Local
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Frequência de Atualização</div>
                  <div className="text-xs text-muted-foreground">
                    Automática a cada 30 segundos
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Última Atualização</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(), "HH:mm:ss", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
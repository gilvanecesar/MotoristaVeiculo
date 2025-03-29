import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Função para formatar valores monetários
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, FileDown, Settings, LineChart, Users, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Tipos para os dados financeiros
interface SubscriptionData {
  id: string;
  clientName: string;
  email: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  amount: number;
  startDate: string;
  endDate: string;
}

interface InvoiceData {
  id: string;
  clientName: string;
  email: string;
  amount: number;
  status: "paid" | "open" | "void" | "uncollectible";
  date: string;
}

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

// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9146FF'];

// Status de assinatura traduzidos
const subscriptionStatusMap = {
  active: "Ativa",
  canceled: "Cancelada",
  past_due: "Pendente",
  trialing: "Teste"
};

// Status de fatura traduzidos
const invoiceStatusMap = {
  paid: "Pago",
  open: "Aberto",
  void: "Cancelado",
  uncollectible: "Não Cobrável"
};

// Cor do badge de acordo com o status
const getSubscriptionBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case "active":
      return "default"; // Substituído "success" por "default"
    case "canceled":
      return "destructive";
    case "past_due":
      return "secondary"; // Substituído "warning" por "secondary"
    case "trialing":
      return "default";
    default:
      return "secondary";
  }
};

const getInvoiceBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case "paid":
      return "default"; // Substituído "success" por "default"
    case "open":
      return "default";
    case "void":
      return "destructive";
    case "uncollectible":
      return "secondary"; // Substituído "warning" por "secondary"
    default:
      return "secondary";
  }
};

// Removi a função duplicada formatCurrency

// Componente principal de finanças
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Buscar estatísticas financeiras
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useQuery<FinanceStats>({
    queryKey: ["/api/admin/finance/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar assinaturas
  const { 
    data: subscriptions, 
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError 
  } = useQuery<SubscriptionData[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Buscar faturas
  const { 
    data: invoices, 
    isLoading: isLoadingInvoices,
    error: invoicesError 
  } = useQuery<InvoiceData[]>({
    queryKey: ["/api/admin/invoices"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Handler para exportar relatório
  const handleExportReport = () => {
    toast({
      title: "Exportação iniciada",
      description: "O relatório será gerado e baixado em breve.",
    });
    // Lógica de exportação (PDF ou Excel)
  };

  // Verificação de erros
  if (statsError || subscriptionsError || invoicesError) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            <CardDescription>
              Não foi possível carregar os dados financeiros. Tente novamente mais tarde.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loader enquanto carrega os dados
  if (isLoadingStats || isLoadingSubscriptions || isLoadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <Link href="/admin/finance/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
        </TabsList>
        
        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2.1% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.activeSubscriptions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.activeSubscriptions || 0} novos assinantes este mês
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.churnRate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.churnRate && stats.churnRate < 3 ? "Abaixo" : "Acima"} da média do setor
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Receita Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal (2025)</CardTitle>
              <CardDescription>
                Acompanhe a evolução da receita ao longo do ano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.monthlyData || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(value)
                      } 
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Receita"]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="var(--primary)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição das Assinaturas */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Assinaturas</CardTitle>
              <CardDescription>
                Distribuição das assinaturas por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.subscriptionsByStatus || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats?.subscriptionsByStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Quantidade"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Assinaturas */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Assinaturas</CardTitle>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Assinatura
                </Button>
              </div>
              <CardDescription>
                Gerenciamento de todas as assinaturas ativas e inativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions && subscriptions.length > 0 ? (
                    subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          <div>{subscription.clientName}</div>
                          <div className="text-xs text-muted-foreground">{subscription.email}</div>
                        </TableCell>
                        <TableCell>{subscription.plan}</TableCell>
                        <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getSubscriptionBadgeVariant(subscription.status)}>
                            {subscriptionStatusMap[subscription.status] || subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(subscription.startDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{new Date(subscription.endDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhuma assinatura encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Faturas */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Faturas</CardTitle>
              <CardDescription>
                Histórico de faturas emitidas
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices && invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>
                          <div>{invoice.clientName}</div>
                          <div className="text-xs text-muted-foreground">{invoice.email}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getInvoiceBadgeVariant(invoice.status)}>
                            {invoiceStatusMap[invoice.status] || invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Baixar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma fatura encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
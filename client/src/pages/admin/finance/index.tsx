import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Dados simulados para o dashboard
const mockSubscriptions = [
  { id: 1, clientName: "Transportadora Silva Ltda", email: "contato@silvatrans.com.br", status: "active", plan: "Premium", startDate: "2025-02-15", nextBillingDate: "2026-02-15", amount: 1198.80 },
  { id: 2, clientName: "Expresso Rápido", email: "financeiro@expressorapido.com.br", status: "active", plan: "Premium", startDate: "2025-03-01", nextBillingDate: "2026-03-01", amount: 1198.80 },
  { id: 3, clientName: "Logística Brasil", email: "admin@logisticabrasil.com", status: "canceled", plan: "Premium", startDate: "2025-01-10", nextBillingDate: "2025-03-10", amount: 1198.80 },
  { id: 4, clientName: "Fretes São Paulo", email: "contato@fretessp.com.br", status: "active", plan: "Premium", startDate: "2025-03-12", nextBillingDate: "2026-03-12", amount: 1198.80 },
  { id: 5, clientName: "Caminhoneiros Unidos", email: "financeiro@caminhoneirosunidos.com.br", status: "trial", plan: "Premium", startDate: "2025-03-25", nextBillingDate: "2025-04-25", amount: 0 },
];

const mockMonthlyRevenue = [
  { name: "Jan", value: 3596.40 },
  { name: "Fev", value: 4795.20 },
  { name: "Mar", value: 7192.80 },
  { name: "Abr", value: 0 },
  { name: "Mai", value: 0 },
  { name: "Jun", value: 0 },
  { name: "Jul", value: 0 },
  { name: "Ago", value: 0 },
  { name: "Set", value: 0 },
  { name: "Out", value: 0 },
  { name: "Nov", value: 0 },
  { name: "Dez", value: 0 },
];

const mockSubscriptionStats = [
  { name: "Ativas", value: 3 },
  { name: "Teste", value: 1 },
  { name: "Canceladas", value: 1 },
];

const mockInvoices = [
  { id: 101, clientName: "Transportadora Silva Ltda", status: "paid", invoiceDate: "2025-02-15", dueDate: "2025-02-15", amount: 1198.80 },
  { id: 102, clientName: "Expresso Rápido", status: "paid", invoiceDate: "2025-03-01", dueDate: "2025-03-01", amount: 1198.80 },
  { id: 103, clientName: "Logística Brasil", status: "refunded", invoiceDate: "2025-01-10", dueDate: "2025-01-10", amount: 1198.80 },
  { id: 104, clientName: "Fretes São Paulo", status: "paid", invoiceDate: "2025-03-12", dueDate: "2025-03-12", amount: 1198.80 },
  { id: 105, clientName: "Caminhoneiros Unidos", status: "upcoming", invoiceDate: "", dueDate: "2025-04-25", amount: 1198.80 },
];

// Cores para os gráficos
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  upcoming: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  refunded: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Simular a obtenção dos dados financeiros
  const { data: subscriptions = mockSubscriptions, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: () => mockSubscriptions, // Em produção, você usaria getQueryFn()
  });

  const { data: invoices = mockInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/admin/invoices'],
    queryFn: () => mockInvoices, // Em produção, você usaria getQueryFn()
  });

  // Métricas calculadas
  const totalActiveSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  // Filtragem de subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch = sub.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Função para formatar os valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  // Badge de status
  const StatusBadge = ({ status }: { status: string }) => {
    let icon;
    switch (status) {
      case 'active':
      case 'paid':
        icon = <CheckCircle className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'trial':
      case 'upcoming':
        icon = <Clock className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'canceled':
      case 'refunded':
        icon = <XCircle className="h-3.5 w-3.5 mr-1" />;
        break;
      default:
        icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
    }

    const statusLabels: { [key: string]: string } = {
      active: "Ativa",
      paid: "Pago",
      trial: "Teste",
      upcoming: "A vencer",
      canceled: "Cancelada",
      refunded: "Reembolsado"
    };

    return (
      <Badge variant="outline" className={STATUS_COLORS[status]}>
        <span className="flex items-center">
          {icon} {statusLabels[status] || status}
        </span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Monitoramento de assinaturas, faturas e receita do sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Relatório sendo gerado", description: "O relatório financeiro será enviado por e-mail em instantes." })}>
            Exportar Relatório
          </Button>
          <Button onClick={() => setLocation("/admin/finance/settings")}>
            Configurações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total Anual
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +12% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assinaturas Ativas
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActiveSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  +2 novas assinaturas este mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Próxima Fatura
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate("2025-04-25")}</div>
                <p className="text-xs text-muted-foreground">
                  Caminhoneiros Unidos - {formatCurrency(1198.80)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribuição de Assinaturas</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={mockSubscriptionStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockSubscriptionStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Receita Mensal 2025</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockMonthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip 
                        formatter={(value) => [`R$ ${value}`, "Receita"]} 
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Bar dataKey="value" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assinaturas */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Assinaturas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as assinaturas de clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por cliente ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="trial">Teste</SelectItem>
                    <SelectItem value="canceled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data início</TableHead>
                      <TableHead>Próxima cobrança</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhuma assinatura encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div className="font-medium">{subscription.clientName}</div>
                            <div className="text-sm text-muted-foreground">{subscription.email}</div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={subscription.status} />
                          </TableCell>
                          <TableCell>{formatDate(subscription.startDate)}</TableCell>
                          <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
                          <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast({ title: "Detalhes", description: "Visualizando detalhes da assinatura" })}>
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({ title: "Email enviado", description: "Email com lembrete enviado com sucesso" })}>
                                  Enviar lembrete
                                </DropdownMenuItem>
                                {subscription.status === "active" && (
                                  <DropdownMenuItem onClick={() => toast({ title: "Cancelamento", description: "Assinatura cancelada com sucesso" })}>
                                    Cancelar assinatura
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Exportar CSV</Button>
              <Button variant="outline">Adicionar manualmente</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Faturas */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Faturas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as faturas geradas e futuras.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura #</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data emissão</TableHead>
                      <TableHead>Data vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{invoice.clientName}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast({ title: "Visualizar", description: "Visualizando fatura" })}>
                                Visualizar fatura
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: "Email enviado", description: "Fatura enviada por email" })}>
                                Enviar por email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: "PDF gerado", description: "PDF da fatura gerado com sucesso" })}>
                                Gerar PDF
                              </DropdownMenuItem>
                              {invoice.status === "upcoming" && (
                                <DropdownMenuItem onClick={() => toast({ title: "Lembrete enviado", description: "Lembrete enviado com sucesso" })}>
                                  Enviar lembrete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Exportar CSV</Button>
              <Button variant="outline">Gerar relatório</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
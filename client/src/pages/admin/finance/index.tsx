import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Função para formatar valores monetários com tratamento robusto de erros
function formatCurrency(value: number | string | null | undefined): string {
  // Garantir que temos um número válido
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }
  
  let numValue: number;
  
  try {
    // Se for string, tentar converter para número
    if (typeof value === 'string') {
      // Remover caracteres não-numéricos exceto ponto e vírgula
      const cleanValue = value.replace(/[^\d.,]/g, '');
      
      // Tratar string vazia
      if (!cleanValue) {
        return 'R$ 0,00';
      }
      
      // Converter vírgula para ponto e parsear
      numValue = parseFloat(cleanValue.replace(',', '.'));
    } else {
      numValue = Number(value);
    }
    
    // Verificar se é um número válido
    if (isNaN(numValue)) {
      console.warn('Valor inválido para formatação de moeda:', value);
      return 'R$ 0,00';
    }
    
    // Garantir que não é um valor negativo (caso isso não seja desejável)
    // Se valores negativos forem válidos, remova esta verificação
    numValue = Math.max(0, numValue);
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(numValue);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return 'R$ 0,00';
  }
}

// Função para formatar datas com tratamento de erros
function formatDate(dateValue: string | Date | null | undefined): string {
  try {
    // Se for null, undefined ou string vazia
    if (!dateValue) {
      return '—';
    }
    
    // Criar objeto Date
    const date = new Date(dateValue);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateValue);
      return '—';
    }
    
    // Formatar a data
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '—';
  }
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, PlusCircle, FileDown, Settings, LineChart, Users, DollarSign, X } from "lucide-react";
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
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos para os dados financeiros
interface SubscriptionData {
  id: string;
  clientId?: number | null;
  clientName: string;
  email: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  amount: number | string | null;  // Permitir diferentes tipos para robustez
  startDate: string | Date | null; // Permitir diferentes tipos para robustez
  endDate: string | Date | null;   // Permitir diferentes tipos para robustez
}

// Interface para dados de clientes
interface ClientData {
  id: number;
  name: string;
  email: string;
  type: string;
}

interface InvoiceData {
  id: string;
  clientName: string;
  email: string;
  amount: number | string | null;  // Permitir diferentes tipos para robustez
  status: "paid" | "open" | "void" | "uncollectible";
  date: string | Date | null;      // Permitir diferentes tipos para robustez
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

// Schema de validação para o formulário de assinatura
const subscriptionFormSchema = z.object({
  clientId: z.number().optional(),
  clientName: z.string().min(3, { message: "Nome do cliente é obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  plan: z.enum(["monthly", "annual", "trial"], { 
    required_error: "Selecione um plano" 
  }),
  amount: z.string().min(1).refine(
    (val) => !isNaN(parseFloat(val.replace(",", "."))),
    { message: "Valor inválido" }
  ),
  status: z.enum(["active", "trialing"], { 
    required_error: "Selecione um status" 
  }),
  startDate: z.date({ required_error: "Data de início é obrigatória" }),
  endDate: z.date({ required_error: "Data de término é obrigatória" }),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

// Componente principal de finanças
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const { toast } = useToast();
  
  // Configuração do formulário de assinatura
  const subscriptionForm = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      clientName: "",
      email: "",
      plan: "monthly",
      amount: "99,90",
      status: "active",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    }
  });
  
  // Buscar lista de clientes para o seletor
  const { 
    data: clients,
    isLoading: isLoadingClients 
  } = useQuery<ClientData[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: showSubscriptionDialog, // Só carrega quando o diálogo está aberto
  });
  
  // Atualizar a data de término quando o valor inicial de data de início mudar
  useEffect(() => {
    if (showSubscriptionDialog) {
      // Quando o diálogo abrir, recalcular a data de término baseada no plano
      const startDate = subscriptionForm.getValues("startDate");
      const planValue = subscriptionForm.getValues("plan");
      let endDate = new Date(startDate);
      
      if (planValue === "monthly") {
        endDate.setMonth(startDate.getMonth() + 1);
      } else if (planValue === "annual") {
        endDate.setFullYear(startDate.getFullYear() + 1);
      } else if (planValue === "trial") {
        endDate.setDate(startDate.getDate() + 7);
      }
      
      subscriptionForm.setValue("endDate", endDate);
    }
  }, [showSubscriptionDialog, subscriptionForm]);
  
  // Função para preencher os dados do cliente quando um cliente é selecionado
  const handleClientSelect = (clientId: number) => {
    const selectedClient = clients?.find(client => client.id === clientId);
    if (selectedClient) {
      subscriptionForm.setValue("clientId", clientId);
      subscriptionForm.setValue("clientName", selectedClient.name);
      subscriptionForm.setValue("email", selectedClient.email);
    }
  };
  
  // Handler para atualizar datas e valores quando o plano é alterado
  const handlePlanChange = (plan: "monthly" | "annual" | "trial") => {
    subscriptionForm.setValue("plan", plan);
    
    // Ajustar o valor baseado no plano
    if (plan === "monthly") {
      subscriptionForm.setValue("amount", "99,90");
    } else if (plan === "annual") {
      subscriptionForm.setValue("amount", "1198,80");
    } else if (plan === "trial") {
      subscriptionForm.setValue("amount", "0");
    }
    
    // Ajustar data de término baseada no plano
    const startDate = subscriptionForm.getValues("startDate");
    let endDate = new Date(startDate);
    
    if (plan === "monthly") {
      endDate.setMonth(startDate.getMonth() + 1);
    } else if (plan === "annual") {
      endDate.setFullYear(startDate.getFullYear() + 1);
    } else if (plan === "trial") {
      endDate.setDate(startDate.getDate() + 7); // 7 dias
    }
    
    subscriptionForm.setValue("endDate", endDate);
  };
  
  // Mutation para criar assinatura
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      // Converte o valor para um número
      const numericAmount = parseFloat(data.amount.replace(",", "."));
      
      // Encontra o cliente correspondente ao nome para obter o ID
      const selectedClient = clients?.find((c) => c.name === data.clientName);
      const clientId = selectedClient?.id;
      
      if (!clientId) {
        throw new Error("Cliente não encontrado. Selecione um cliente válido da lista.");
      }
      
      // Mapeia plan para planType que é o que o backend espera
      const payload = {
        ...data,
        clientId,  // Adiciona o ID do cliente
        planType: data.plan, // Adiciona planType mapeado de plan
        amount: numericAmount,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString()
      };
      
      console.log("Enviando payload:", payload); // Log para debug
      
      const response = await apiRequest("POST", "/api/admin/subscriptions", payload);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar a query para buscar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/stats"] });
      
      // Fechar o modal e exibir mensagem de sucesso
      setShowSubscriptionDialog(false);
      toast({
        title: "Assinatura criada",
        description: "A assinatura foi criada com sucesso.",
      });
      
      // Resetar o formulário
      subscriptionForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message || "Não foi possível criar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Buscar estatísticas financeiras da OpenPix em tempo real
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useQuery<FinanceStats>({
    queryKey: ["/api/admin/openpix/finance/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar assinaturas da OpenPix em tempo real
  const { 
    data: subscriptions, 
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError 
  } = useQuery<SubscriptionData[]>({
    queryKey: ["/api/admin/openpix/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar faturas da OpenPix em tempo real
  const { 
    data: invoices, 
    isLoading: isLoadingInvoices,
    error: invoicesError 
  } = useQuery<InvoiceData[]>({
    queryKey: ["/api/admin/openpix/invoices"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">OpenPix Live</span>
          </div>
        </div>
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
                <Button size="sm" onClick={() => setShowSubscriptionDialog(true)}>
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
                    subscriptions
                      // Filtrar apenas assinaturas com valor numérico válido maior que zero
                      .filter((subscription) => {
                        // Verificar se o valor é um número válido
                        let numAmount = 0;
                        
                        if (typeof subscription.amount === 'string') {
                          // Verificar se é uma string válida
                          if (subscription.amount) {
                            try {
                              // Converter para string de maneira segura
                              const amountStr = String(subscription.amount);
                              // Limpar a string
                              const cleanAmount = amountStr.replace(/[^\d.,]/g, '').replace(',', '.');
                              numAmount = parseFloat(cleanAmount);
                            } catch (e) {
                              console.warn('Erro ao processar string de valor:', e);
                            }
                          }
                        } else if (typeof subscription.amount === 'number') {
                          numAmount = subscription.amount;
                        }
                        
                        return !isNaN(numAmount) && numAmount > 0;
                      })
                      .map((subscription) => {
                        // Determinar o nome do plano baseado no planType ou outros dados disponíveis
                        let planName = subscription.plan || subscription.planType || 'Mensal';
                        
                        // Converter o tipo de plano para um formato legível
                        if (planName === 'monthly') {
                          planName = 'Mensal';
                        } else if (planName === 'annual') {
                          planName = 'Anual';
                        } else if (planName === 'trial') {
                          planName = 'Teste';
                        }
                        
                        // Extrair data de início e fim
                        const startDate = subscription.startDate || subscription.currentPeriodStart;
                        const endDate = subscription.endDate || subscription.currentPeriodEnd;
                        
                        // Determinar o nome do cliente
                        const clientName = subscription.clientName || 'Cliente';
                        
                        // Determinar email (com fallback para evitar dados undefined)
                        const email = subscription.email || '';
                        
                        return (
                          <TableRow key={subscription.id}>
                            <TableCell className="font-medium">
                              <div>{clientName}</div>
                              <div className="text-xs text-muted-foreground">{email}</div>
                            </TableCell>
                            <TableCell>{planName}</TableCell>
                            <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={getSubscriptionBadgeVariant(subscription.status)}>
                                {subscriptionStatusMap[subscription.status] || subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(startDate)}</TableCell>
                            <TableCell>{formatDate(endDate)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
                          <p>Nenhuma assinatura encontrada.</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Crie uma nova assinatura usando o botão acima.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setShowSubscriptionDialog(true)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Assinatura
                          </Button>
                        </div>
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
                    invoices
                      // Filtrar apenas faturas com valor numérico válido maior que zero
                      .filter((invoice) => {
                        // Verificar se o valor é um número válido
                        let numAmount = 0;
                        
                        if (typeof invoice.amount === 'string') {
                          // Verificar se é uma string válida
                          if (invoice.amount) {
                            try {
                              // Converter para string de maneira segura
                              const amountStr = String(invoice.amount);
                              // Limpar a string
                              const cleanAmount = amountStr.replace(/[^\d.,]/g, '').replace(',', '.');
                              numAmount = parseFloat(cleanAmount);
                            } catch (e) {
                              console.warn('Erro ao processar string de valor:', e);
                            }
                          }
                        } else if (typeof invoice.amount === 'number') {
                          numAmount = invoice.amount;
                        }
                        
                        return !isNaN(numAmount) && numAmount > 0;
                      })
                      .map((invoice) => (
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
                          <TableCell>{formatDate(invoice.date)}</TableCell>
                          <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Baixar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileDown className="h-8 w-8 text-muted-foreground mb-2" />
                          <p>Nenhuma fatura encontrada.</p>
                          <p className="text-xs text-muted-foreground">
                            As faturas serão geradas automaticamente quando houver assinaturas ativas.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => setShowSubscriptionDialog(true)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Assinatura
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogo para cadastro de assinatura */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>
              Cadastre uma nova assinatura manualmente no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...subscriptionForm}>
            <form 
              className="space-y-4 py-2" 
              onSubmit={subscriptionForm.handleSubmit((data) => createSubscriptionMutation.mutate(data))}
            >
              {/* Seletor de cliente existente */}
              {clients && clients.length > 0 && (
                <div className="mb-4">
                  <FormLabel>Selecionar Cliente Existente</FormLabel>
                  <Select onValueChange={(value) => handleClientSelect(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} - {client.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Selecione um cliente existente ou preencha os campos manualmente
                  </div>
                </div>
              )}
              
              {/* Loader para clientes */}
              {isLoadingClients && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando clientes...</span>
                </div>
              )}

              {/* Campo oculto para clientId */}
              <FormField
                control={subscriptionForm.control}
                name="clientId"
                render={({ field }) => (
                  <input type="hidden" {...field} value={field.value?.toString() || ""} />
                )}
              />
              
              <FormField
                control={subscriptionForm.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o nome do cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={subscriptionForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com.br" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={subscriptionForm.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano</FormLabel>
                    <Select 
                      onValueChange={(value: "monthly" | "annual" | "trial") => {
                        field.onChange(value);
                        handlePlanChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="trial">Período de teste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={subscriptionForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="99,90" />
                    </FormControl>
                    <FormDescription>
                      Digite o valor mensal da assinatura (ex: 99,90).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={subscriptionForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="trialing">Período de teste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={subscriptionForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                // Primeiro atualiza o valor no formulário
                                field.onChange(date);
                                
                                // Pega o plano atual selecionado
                                const planValue = subscriptionForm.getValues("plan");
                                let endDate = new Date(date);
                                
                                if (planValue === "monthly") {
                                  endDate.setMonth(date.getMonth() + 1);
                                } else if (planValue === "annual") {
                                  endDate.setFullYear(date.getFullYear() + 1);
                                } else if (planValue === "trial") {
                                  endDate.setDate(date.getDate() + 7);
                                }
                                
                                subscriptionForm.setValue("endDate", endDate);
                              }
                            }}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={subscriptionForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowSubscriptionDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar Assinatura'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
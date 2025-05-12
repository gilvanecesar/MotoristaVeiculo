import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ExternalLink, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Invoice = {
  id: string;
  amount: number;
  status: string;
  created: string | null;
  period_start: string | null;
  period_end: string | null;
  subscription: string;
  pdf: string | null;
  payment_method?: {
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    }
  } | null;
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Buscar faturas
  const { 
    data: invoices, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['/api/user/invoices'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/invoices');
      const data = await res.json();
      return data.invoices as Invoice[];
    }
  });
  
  // Mutation para criar sessão do portal Stripe
  const createPortalSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/create-portal-session');
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      // Redirecionar para o portal do Stripe
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao acessar portal de pagamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Formatar valor em reais
  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) {
      return "R$ 0,00";
    }
    
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount / 100); // Stripe retorna valores em centavos
    } catch (error) {
      console.error("Erro ao formatar valor:", amount, error);
      return "R$ 0,00";
    }
  };
  
  // Formatar data
  const formatDate = (date: string | null) => {
    try {
      if (!date) {
        return "Data não disponível";
      }
      
      // Verificar se a data é um timestamp (número) ou já está no formato ISO
      let dateValue;
      
      if (!isNaN(Number(date))) {
        // Se for número, multiplicar por 1000 para converter de segundos para milissegundos
        dateValue = new Date(Number(date) * 1000);
      } else if (typeof date === 'string' && date.trim() !== '') {
        // Se já for string de data, usar diretamente
        dateValue = new Date(date);
      } else {
        return "Data não disponível";
      }
      
      // Verificar se a data é válida
      if (isNaN(dateValue.getTime())) {
        return "Data não disponível";
      }
      
      return format(dateValue, "dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch (error) {
      console.error("Erro ao formatar data:", date, error);
      return "Data não disponível";
    }
  };
  
  // Obter status da fatura em português
  const getInvoiceStatus = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "Paga", color: "bg-green-50 text-green-700 hover:bg-green-50" };
      case "open":
        return { label: "Aberta", color: "bg-blue-50 text-blue-700 hover:bg-blue-50" };
      case "uncollectible":
        return { label: "Não coletável", color: "bg-red-50 text-red-700 hover:bg-red-50" };
      case "void":
        return { label: "Anulada", color: "bg-gray-50 text-gray-700 hover:bg-gray-50" };
      case "draft":
        return { label: "Rascunho", color: "bg-orange-50 text-orange-700 hover:bg-orange-50" };
      default:
        return { label: status, color: "bg-gray-50 text-gray-700 hover:bg-gray-50" };
    }
  };
  
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar faturas</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seu histórico de faturas. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
        
        <Button variant="outline" asChild className="mb-6">
          <Link href="/subscribe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para gerenciamento de assinatura
          </Link>
        </Button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
        </div>
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Faturas e Pagamentos</h1>
          <p className="text-muted-foreground">Visualize e gerencie seu histórico de pagamentos</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/subscribe">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          <Button 
            onClick={() => createPortalSessionMutation.mutate()}
            disabled={createPortalSessionMutation.isPending}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {createPortalSessionMutation.isPending ? "Carregando..." : "Gerenciar Pagamentos"}
          </Button>
        </div>
      </div>
      
      {/* Verificação de dados de fatura */}
      {!invoices || invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Você ainda não possui faturas em seu histórico. Elas aparecerão aqui após a realização do seu primeiro pagamento.
              </p>
              
              <Button asChild>
                <Link href="/subscribe">
                  Ver Planos Disponíveis
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            <CardDescription>Todas as suas faturas e informações de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método de Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(invoice.created)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <span>{formatDate(invoice.period_start)}</span>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>De {formatDate(invoice.period_start)} até {formatDate(invoice.period_end)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getInvoiceStatus(invoice.status).color}>
                          {getInvoiceStatus(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.payment_method?.card ? (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span>•••• {invoice.payment_method.card.last4}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não disponível</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.pdf ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(invoice.pdf || '#', '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Observações importantes */}
      <div className="mt-8">
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>Informações sobre pagamentos</AlertTitle>
          <AlertDescription>
            Os pagamentos são processados de forma segura pelo Stripe. Para questões relacionadas a pagamentos,
            entre em contato com nossa equipe de suporte através do e-mail suporte@querofretes.com.br.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
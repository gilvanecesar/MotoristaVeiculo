import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  CreditCard,
  Search,
  Calendar
} from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

type PaymentHistoryItem = {
  id: string;
  status: string;
  statusDetail: string;
  description: string;
  paymentMethod: {
    id: string;
    type: string;
  };
  amount: number;
  createdAt: string;
  approvedAt: string | null;
  mercadopagoId: string;
  externalReference?: string;
};

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  
  // Buscar histórico de pagamentos
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/user/payment-history'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/payment-history');
      const data = await res.json();
      return data.payments as PaymentHistoryItem[];
    }
  });
  
  // Formatar valor monetário
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };
  
  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch (error) {
      return 'Data não disponível';
    }
  };
  
  // Retornar detalhes do status do pagamento
  const getPaymentStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Aprovado',
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          color: 'bg-green-50 text-green-700 hover:bg-green-50'
        };
      case 'pending':
        return {
          label: 'Pendente',
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          color: 'bg-amber-50 text-amber-700 hover:bg-amber-50'
        };
      case 'in_process':
        return {
          label: 'Em processamento',
          icon: <Clock className="h-4 w-4 text-blue-500" />,
          color: 'bg-blue-50 text-blue-700 hover:bg-blue-50'
        };
      case 'rejected':
        return {
          label: 'Rejeitado',
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          color: 'bg-red-50 text-red-700 hover:bg-red-50'
        };
      case 'refunded':
        return {
          label: 'Reembolsado',
          icon: <AlertTriangle className="h-4 w-4 text-purple-500" />,
          color: 'bg-purple-50 text-purple-700 hover:bg-purple-50'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          icon: <XCircle className="h-4 w-4 text-gray-500" />,
          color: 'bg-gray-50 text-gray-700 hover:bg-gray-50'
        };
      default:
        return {
          label: status,
          icon: <AlertTriangle className="h-4 w-4 text-gray-500" />,
          color: 'bg-gray-50 text-gray-700 hover:bg-gray-50'
        };
    }
  };
  
  // Filtrar pagamentos por status e busca
  const filteredPayments = React.useMemo(() => {
    if (!data) return [];
    
    return data.filter(payment => {
      // Filtrar por status
      if (statusFilter !== 'all' && payment.status !== statusFilter) {
        return false;
      }
      
      // Filtrar por busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          payment.description.toLowerCase().includes(query) ||
          payment.mercadopagoId.toLowerCase().includes(query) ||
          formatCurrency(payment.amount).toLowerCase().includes(query) ||
          (payment.statusDetail || '').toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [data, statusFilter, searchQuery]);
  
  // Obter métodos de pagamento disponíveis para filtro
  const availableStatuses = React.useMemo(() => {
    if (!data) return [];
    
    const statuses = new Set<string>();
    data.forEach(payment => {
      statuses.add(payment.status);
    });
    
    return Array.from(statuses).sort();
  }, [data]);
  
  // Conteúdo para renderização condicional
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar histórico</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seu histórico de pagamentos. Tente novamente mais tarde.
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
          <h1 className="text-2xl font-bold mb-2">Histórico de Pagamentos</h1>
          <p className="text-muted-foreground">Visualize todos os seus pagamentos realizados no sistema</p>
        </div>
        
        <Button 
          variant="outline" 
          asChild
        >
          <Link href="/subscribe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre seu histórico de pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por descrição, ID ou valor"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getPaymentStatus(status).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela de histórico */}
      {!filteredPayments || filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhum pagamento corresponde aos filtros selecionados. Tente outros critérios de busca.'
                  : 'Você ainda não possui pagamentos em seu histórico. Eles aparecerão aqui após a realização do seu primeiro pagamento.'}
              </p>
              
              <Button asChild>
                <Link href="/subscribe/plans">
                  Ver Planos Disponíveis
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>
              {filteredPayments.length} pagamento{filteredPayments.length !== 1 ? 's' : ''} encontrado{filteredPayments.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">ID do Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>{payment.description || 'Assinatura QUERO FRETES'}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className={getPaymentStatus(payment.status).color}>
                                <span className="flex items-center gap-1">
                                  {getPaymentStatus(payment.status).icon}
                                  <span>{getPaymentStatus(payment.status).label}</span>
                                </span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{payment.statusDetail || getPaymentStatus(payment.status).label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span>
                            {payment.paymentMethod.type === 'credit_card' 
                              ? 'Cartão de crédito' 
                              : payment.paymentMethod.type === 'debit_card' 
                              ? 'Cartão de débito'
                              : payment.paymentMethod.type === 'bank_transfer'
                              ? 'Transferência bancária'
                              : payment.paymentMethod.type || 'Mercado Pago'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {payment.mercadopagoId.substring(0, 10)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Observações */}
      <div className="mt-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Informações sobre pagamentos</AlertTitle>
          <AlertDescription>
            Os pagamentos são processados de forma segura pelo Mercado Pago. Para questões relacionadas a pagamentos,
            entre em contato com nossa equipe de suporte através do e-mail suporte@querofretes.com.br.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
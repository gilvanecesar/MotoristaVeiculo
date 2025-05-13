import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

// Tipos
interface Payment {
  id: string;
  status: string;
  date: string;
  amount: string;
  description: string;
  paymentMethod: string;
  receiptUrl?: string;
}

export default function InvoicesFixed() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPayments() {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/invoices');
        
        if (response.ok) {
          const data = await response.json();
          setPayments(data || []);
        } else {
          throw new Error('Erro ao carregar histórico de pagamentos');
        }
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o histórico de pagamentos',
          variant: 'destructive',
        });
        // Fornecer alguns dados de amostra para exibição
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, [toast]);

  // Função para obter o status traduzido e a classe CSS
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
        return { label: 'Pago', className: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' };
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return { label: 'Falhou', className: 'bg-red-100 text-red-800' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return 'Data inválida';
    }
  };

  const formatCurrency = (amount: string) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(parseFloat(amount));
    } catch (e) {
      return amount;
    }
  };

  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const statusInfo = getStatusInfo(payment.status);
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{payment.description || 'Assinatura QueroFretes'}</CardTitle>
              <CardDescription>{formatDate(payment.date)}</CardDescription>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{formatCurrency(payment.amount)}</p>
              <p className="text-sm text-muted-foreground">
                {payment.paymentMethod === 'mercadopago' ? 'Mercado Pago' : payment.paymentMethod}
              </p>
            </div>
            {payment.receiptUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(payment.receiptUrl, '_blank')}>
                Ver recibo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-6">Faturas e Pagamentos</h1>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.length > 0 ? (
            payments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="paid">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.filter(p => 
              ['approved', 'paid'].includes(p.status.toLowerCase())
            ).length > 0 ? (
            payments
              .filter(p => ['approved', 'paid'].includes(p.status.toLowerCase()))
              .map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum pagamento pago encontrado</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.filter(p => 
              p.status.toLowerCase() === 'pending'
            ).length > 0 ? (
            payments
              .filter(p => p.status.toLowerCase() === 'pending')
              .map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum pagamento pendente encontrado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
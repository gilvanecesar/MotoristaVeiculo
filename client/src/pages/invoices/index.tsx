import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
  HelpCircle,
  BarChart
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Buscar cobranças do OpenPix específicas do usuário logado
  const { data: openPixCharges, isLoading, error } = useQuery({
    queryKey: ["/api/openpix/my-charges"],
    enabled: !!user
  });

  // Transformar dados do OpenPix para o formato da interface
  // Filtrar apenas cobranças únicas e remover duplicatas, ordenar por data mais recente
  const uniqueCharges = openPixCharges?.charges?.filter((charge: any, index: number, array: any[]) => {
    // Manter apenas a primeira ocorrência de cada identifier único
    return array.findIndex(c => c.identifier === charge.identifier) === index;
  }).sort((a: any, b: any) => {
    // Ordenar por data de criação mais recente primeiro
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  const invoices = uniqueCharges.map((charge: any, index: number) => {
    // OpenPix retorna valores em centavos, então convertemos para reais
    const value = Number(charge.value) || 4990; // Default para R$ 49,90 em centavos
    const valueInReais = value / 100;
    
    return {
      id: charge.correlationID || charge.identifier || `charge-${Date.now()}-${index}`,
      status: charge.status === "COMPLETED" ? "paid" : charge.status === "ACTIVE" ? "unpaid" : "failed",
      amountDue: valueInReais,
      amountPaid: charge.status === "COMPLETED" ? valueInReais : 0,
      date: new Date(charge.createdAt || Date.now()),
      dueDate: new Date(charge.expiresDate || Date.now()),
      planType: "Plano Mensal - 30 dias",
      pixCode: charge.brCode,
      pixUrl: charge.paymentLinkUrl,
      qrCodeImage: charge.qrCodeImage,
      description: charge.comment || "Assinatura QUERO FRETES - Plano Mensal"
    };
  });
  
  // Formatar moeda com validação aprimorada
  const formatCurrency = (value: any) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return 'R$ 49,90'; // Valor padrão do plano
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };
  
  // Formatar data
  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: pt });
  };
  
  // Obter status do pagamento formatado
  const getPaymentStatus = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "Pago", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50" };
      case "unpaid":
        return { label: "Pendente", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50" };
      case "failed":
        return { label: "Falhou", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50" };
      default:
        return { label: status, color: "" };
    }
  };
  
  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Fatura de demonstração",
      description: "Esta é uma versão de demonstração. Em produção, este botão permitiria baixar a fatura.",
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Faturas e Pagamentos</h1>
          <p className="text-muted-foreground">Gerenciar faturas e pagamentos da sua assinatura</p>
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
        </div>
      </div>
      
      {/* Status de Carregamento ou Erro */}
      {isLoading && (
        <Alert className="mb-6">
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>Carregando</AlertTitle>
          <AlertDescription>
            Buscando informações de pagamentos do OpenPix...
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar as informações de pagamento. Tente novamente em alguns instantes.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Histórico de suas faturas e pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Você ainda não possui nenhuma fatura. Elas aparecerão aqui após o processamento dos seus pagamentos.
              </p>
              
              <Button asChild>
                <Link href="/subscribe">
                  Ver Planos Disponíveis
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>PIX</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {formatDate(invoice.date)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amountDue)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getPaymentStatus(invoice.status).color}
                        >
                          {getPaymentStatus(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.planType}
                      </TableCell>
                      <TableCell>
                        {invoice.pixUrl ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(invoice.pixUrl, '_blank')}
                            title="Abrir link PIX"
                          >
                            PIX
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            title="Baixar fatura"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.qrCodeImage && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => window.open(invoice.qrCodeImage, '_blank')}
                              title="Ver QR Code PIX"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Informações sobre PIX */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pagamento via PIX</CardTitle>
          <CardDescription>Todas as transações são processadas via PIX</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border rounded-md bg-green-50">
            <div className="bg-green-100 p-2 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">PIX Instantâneo</p>
              <p className="text-sm text-green-600">Pagamentos processados em tempo real</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Informações Adicionais */}
      <div className="mt-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Informações sobre pagamentos</AlertTitle>
          <AlertDescription>
            Para problemas relacionados a pagamentos ou dúvidas sobre suas faturas, 
            entre em contato com nosso suporte através do menu "Reportar Problema" ou pelo email suporte@querofretes.com.br.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
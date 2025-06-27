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
  
  // Buscar cobranças do OpenPix
  const { data: openPixCharges, isLoading, error } = useQuery({
    queryKey: ["/api/openpix/charges"],
    enabled: !!user
  });
  
  // Transformar dados do OpenPix para o formato da interface
  const invoices = openPixCharges?.charges?.map((charge: any) => ({
    id: charge.charge?.correlationID || charge.charge?.identifier,
    status: charge.charge?.status === "COMPLETED" ? "paid" : charge.charge?.status === "ACTIVE" ? "unpaid" : "failed",
    amountDue: charge.charge?.value / 100, // OpenPix retorna em centavos
    amountPaid: charge.charge?.status === "COMPLETED" ? charge.charge?.value / 100 : 0,
    date: new Date(charge.charge?.createdAt || Date.now()),
    dueDate: new Date(charge.charge?.expiresDate || Date.now()),
    planType: "Acesso 30 dias",
    pixCode: charge.charge?.brCode,
    pixUrl: charge.charge?.paymentLinkUrl,
    qrCodeImage: charge.charge?.qrCodeImage,
    description: charge.charge?.comment || "Pagamento PIX - QUERO FRETES"
  })) || [];
  
  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
      
      {/* Nota de Informação */}
      <Alert className="mb-6">
        <HelpCircle className="h-4 w-4" />
        <AlertTitle>Versão de Demonstração</AlertTitle>
        <AlertDescription>
          Esta é uma versão de demonstração com dados de exemplo. Em um ambiente de produção, 
          este painel exibirá suas faturas reais do sistema.
        </AlertDescription>
      </Alert>
      
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
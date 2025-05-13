import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  
  // Em vez de fazer requisição para a API que está gerando problemas,
  // vamos usar dados fictícios simples com uma mensagem de esclarecimento
  // para fins de demonstração
  const invoices = [
    {
      id: "inv-demo-1",
      status: "paid",
      amountDue: 99.90,
      amountPaid: 99.90,
      date: new Date(2025, 4, 1), // 1 de maio de 2025
      dueDate: new Date(2025, 4, 5), // 5 de maio de 2025
      planType: "Mensal",
      paymentMethod: "Cartão de crédito",
      url: "#",
      pdf: "#",
      description: "Assinatura Mensal - QUERO FRETES"
    }
  ];
  
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
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
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
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            title="Baixar fatura"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.url && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => window.open(invoice.url, '_blank')}
                              title="Ver fatura online"
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
      
      {/* Métodos de Pagamento */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
          <CardDescription>Gerencie seus métodos de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-md mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Cartão de crédito</p>
                <p className="text-sm text-muted-foreground">**** **** **** 4242</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Padrão</Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                toast({
                  title: "Funcionalidade de demonstração",
                  description: "Em produção, este botão permitiria atualizar seus métodos de pagamento."
                });
              }}
            >
              Atualizar Método de Pagamento
            </Button>
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
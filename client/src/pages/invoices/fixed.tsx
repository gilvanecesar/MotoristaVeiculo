import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Download, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Formata valores monetários
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Dados demo para faturas
const demoInvoices = [
  {
    id: "INV-2025-001",
    date: new Date(2025, 4, 1),
    amount: 99.90,
    status: "paid",
    paymentMethod: "Cartão de Crédito",
    downloadUrl: "#"
  },
  {
    id: "INV-2025-002",
    date: new Date(2025, 3, 1),
    amount: 99.90,
    status: "paid",
    paymentMethod: "Cartão de Crédito",
    downloadUrl: "#"
  },
  {
    id: "INV-2025-003",
    date: new Date(2025, 2, 1),
    amount: 99.90,
    status: "paid",
    paymentMethod: "Cartão de Crédito",
    downloadUrl: "#"
  }
];

export default function InvoicesPageFixed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState(demoInvoices);

  useEffect(() => {
    // Simula o carregamento das faturas
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDownload = (invoiceId: string) => {
    toast({
      title: "Download iniciado",
      description: `Download da fatura ${invoiceId} em andamento...`,
    });
    
    // Simula o download
    setTimeout(() => {
      toast({
        title: "Download concluído",
        description: "Esta é uma versão de demonstração. O download real de faturas está desabilitado.",
      });
    }, 2000);
  };
  
  return (
    <div>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Faturas e Pagamentos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie suas faturas e pagamentos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>
              Todas as suas faturas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Método de Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.date.toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{currencyFormatter.format(invoice.amount)}</TableCell>
                        <TableCell>
                          {invoice.status === 'paid' ? (
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-500">Pago</span>
                            </div>
                          ) : invoice.status === 'pending' ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 text-yellow-500 mr-1 animate-spin" />
                              <span className="text-yellow-500">Pendente</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <X className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-red-500">Cancelado</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{invoice.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(invoice.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {invoices.length} faturas
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Pagamento</CardTitle>
            <CardDescription>
              Seus métodos de pagamento cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Adicionar Novo Método de Pagamento
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
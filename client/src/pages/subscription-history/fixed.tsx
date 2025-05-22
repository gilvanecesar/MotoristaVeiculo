import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Formata valores monetários
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function SubscriptionHistoryPageFixed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Criar histórico com dados reais do usuário
      const userSubscriptionHistory = [];
      
      // Verificar se o usuário possui uma assinatura ativa
      if (user.subscriptionActive) {
        // Datas baseadas nos dados do usuário
        const startDate = user.createdAt ? new Date(user.createdAt) : new Date();
        const endDate = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : new Date();
        
        // Definir tipo de plano baseado no subscriptionType
        let planType = "Mensal";
        let amount = 99.90;
        
        if (user.subscriptionType === "trial") {
          planType = "Período de Teste";
          amount = 0;
        } else if (user.subscriptionType === "annual") {
          planType = "Anual";
          amount = 960.00;
        }
        
        userSubscriptionHistory.push({
          id: `SUB-${user.id}-${new Date().getFullYear()}`,
          startDate: startDate,
          endDate: endDate,
          planType: planType,
          amount: amount,
          status: user.subscriptionActive ? "active" : "inactive"
        });
      }
      
      setHistory(userSubscriptionHistory);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Assinatura</h1>
          <p className="text-muted-foreground">
            Acompanhe o histórico da sua assinatura
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Assinatura</CardTitle>
            <CardDescription>
              Detalhes do seu histórico de assinaturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-muted-foreground">Nenhum histórico de assinatura encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Término</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.startDate.toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{item.endDate.toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{item.planType}</TableCell>
                        <TableCell>{currencyFormatter.format(item.amount)}</TableCell>
                        <TableCell>
                          {item.status === 'active' ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-500">Ativo</span>
                            </div>
                          ) : item.status === 'completed' ? (
                            <span className="text-muted-foreground">Concluído</span>
                          ) : (
                            <span className="text-red-500">Cancelado</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Pagamentos</CardTitle>
            <CardDescription>
              Total pago em assinaturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <span className="font-medium">Total de Assinaturas</span>
                <span>{history.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <span className="font-medium">Valor Total Pago</span>
                <span className="font-semibold text-lg">
                  {currencyFormatter.format(
                    history.reduce((total, item) => total + item.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md bg-primary/5">
                <span className="font-medium">Assinatura Atual</span>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold">
                    {user?.subscriptionType === "trial" 
                      ? "Período de Teste"
                      : user?.subscriptionType === "annual" 
                        ? `${currencyFormatter.format(960.00)} / ano` 
                        : `${currencyFormatter.format(99.90)} / mês`
                    }
                  </span>
                  {user?.subscriptionActive && user?.subscriptionExpiresAt && (
                    <div className="flex items-center gap-1 text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      <span>Ativo até {new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
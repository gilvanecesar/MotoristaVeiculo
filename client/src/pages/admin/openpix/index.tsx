import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, RefreshCw, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminOpenPixPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [charges, setCharges] = useState<any[]>([]);

  const testOpenPixConnection = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/openpix/charges?limit=10");
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Conexão com OpenPix testada com sucesso!",
        });
        setCharges(data.charges || []);
      } else {
        throw new Error(data.details || "Erro ao conectar com OpenPix");
      }
    } catch (error: any) {
      console.error("Erro ao testar OpenPix:", error);
      toast({
        title: "Erro",
        description: `Falha ao conectar: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncPayments = async () => {
    setIsSyncing(true);
    try {
      const response = await apiRequest("POST", "/api/openpix/sync");
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sincronização concluída",
          description: `${data.syncedCount} pagamentos sincronizados. ${data.errorCount} erros.`,
        });
      } else {
        throw new Error(data.details || "Erro na sincronização");
      }
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
      toast({
        title: "Erro",
        description: `Falha na sincronização: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Administração OpenPix
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie e sincronize pagamentos PIX via OpenPix
        </p>
      </div>

      <div className="grid gap-6">
        {/* Testes de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Teste de Conexão
            </CardTitle>
            <CardDescription>
              Teste a conexão com a API do OpenPix
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testOpenPixConnection} 
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>

              <Button 
                onClick={syncPayments} 
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Pagamentos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cobranças */}
        {charges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Últimas Cobranças OpenPix</CardTitle>
              <CardDescription>
                Últimas {charges.length} cobranças da API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {charges.map((charge, index) => (
                  <div 
                    key={charge.identifier || index}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{charge.comment || 'Sem descrição'}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {charge.identifier}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Correlation: {charge.correlationID}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {charge.value?.toFixed(2) || '0,00'}</p>
                      <span 
                        className={`px-2 py-1 rounded text-xs ${
                          charge.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {charge.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da API */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Integração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Status da API</h4>
                <p className="text-sm text-muted-foreground">
                  A integração OpenPix permite criar cobranças PIX e receber notificações de pagamento em tempo real.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Sincronização</h4>
                <p className="text-sm text-muted-foreground">
                  Sincroniza automaticamente pagamentos aprovados dos últimos 30 dias com o banco de dados local.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
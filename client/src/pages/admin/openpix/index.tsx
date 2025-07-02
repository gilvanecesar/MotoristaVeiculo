import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, RefreshCw, Eye, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminOpenPixPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [charges, setCharges] = useState<any[]>([]);
  const [lastCharge, setLastCharge] = useState<any>(null);

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

  const createTestCharge = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/openpix/create-charge", {
        planType: "monthly",
        email: "test@querofretes.com.br",
        name: "Teste OpenPix"
      });
      const data = await response.json();
      
      if (response.ok) {
        console.log('Dados da cobrança recebidos:', data);
        setLastCharge(data);
        toast({
          title: "Cobrança criada",
          description: `PIX de R$ 49,90 criado com sucesso!`,
        });
        // Recarregar lista de cobranças
        testOpenPixConnection();
      } else {
        throw new Error(data.details || "Erro ao criar cobrança");
      }
    } catch (error: any) {
      console.error("Erro ao criar cobrança:", error);
      toast({
        title: "Erro",
        description: `Falha ao criar cobrança: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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

              <Button 
                onClick={createTestCharge} 
                disabled={isCreating}
                variant="default"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar PIX Teste (R$ 49,90)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Última Cobrança Criada */}
        {lastCharge && (
          <Card>
            <CardHeader>
              <CardTitle>Cobrança PIX Criada</CardTitle>
              <CardDescription>
                Última cobrança gerada - escaneie o QR Code para testar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Informações da Cobrança</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Valor:</strong> R$ {((lastCharge.charge?.value || 0) / 100).toFixed(2).replace('.', ',')}</p>
                    <p><strong>ID:</strong> {lastCharge.charge?.identifier}</p>
                    <p><strong>Status:</strong> {lastCharge.charge?.status}</p>
                    <p><strong>Cliente:</strong> {lastCharge.charge?.customer?.name}</p>
                    <p><strong>Email:</strong> {lastCharge.charge?.customer?.email}</p>
                  </div>
                  {lastCharge.charge?.paymentLinkUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(lastCharge.charge.paymentLinkUrl, '_blank')}
                    >
                      Abrir Link de Pagamento
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <h4 className="font-semibold">QR Code PIX</h4>
                  {lastCharge.charge?.qrCodeImage ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img 
                        src={lastCharge.charge.qrCodeImage} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 border rounded"
                        onError={(e) => {
                          console.error('Erro ao carregar QR Code:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Escaneie com seu banco ou app de pagamento
                      </p>
                    </div>
                  ) : (
                    <div className="w-48 h-48 border rounded flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p>QR Code não disponível</p>
                        <p className="text-xs">Verifique os logs do servidor</p>
                      </div>
                    </div>
                  )}
                  {lastCharge.charge?.brCode && (
                    <div className="text-xs text-center break-all max-w-48 mt-2">
                      <strong>Código PIX Copia e Cola:</strong><br />
                      <textarea 
                        className="w-full h-16 text-xs p-1 border rounded resize-none"
                        value={lastCharge.charge.brCode}
                        readOnly
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                      <p className="font-bold">R$ {((charge.value || 0) / 100).toFixed(2).replace('.', ',')}</p>
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
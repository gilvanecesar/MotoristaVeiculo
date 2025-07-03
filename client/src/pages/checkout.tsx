import { useState, useEffect, useRef } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, Check, ArrowLeft, Copy } from "lucide-react";
import { useLocation } from 'wouter';
import { Badge } from "@/components/ui/badge";

export default function Checkout() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [pixCharge, setPixCharge] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed'>('pending');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isManualCheck, setIsManualCheck] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the plan from URL query parameter
  const [searchParams] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");

  const planDetails = {
    monthly: {
      name: "Plano Oficial",
      price: "R$ 49,90",
      description: "Acesso por 30 dias",
      period: "mês",
      value: 4990
    }
  };

  const currentPlan = planDetails[selectedPlan as keyof typeof planDetails];

  // Verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!pixCharge?.charge?.identifier) return;
    
    try {
      setIsCheckingPayment(true);
      
      // Primeiro, verificar se o usuário já tem assinatura ativa
      const userResponse = await apiRequest("GET", "/api/user");
      const userData = await userResponse.json();
      
      if (userData.subscriptionActive === true) {
        console.log('Usuário já tem assinatura ativa, redirecionando...');
        
        // Evitar redirecionamento múltiplo
        if (isRedirecting) {
          console.log('Redirecionamento já em andamento, ignorando...');
          return;
        }
        
        setIsRedirecting(true);
        setPaymentStatus('completed');
        
        // Limpar intervalo
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        toast({
          title: "Pagamento confirmado!",
          description: "Sua assinatura foi ativada com sucesso. Redirecionando...",
        });
        
        // Redirecionar imediatamente
        setTimeout(() => {
          console.log('Redirecionando para /home...');
          navigate("/home");
        }, 500);
        
        return;
      }
      
      // Verificar status diretamente na OpenPix
      const openPixResponse = await apiRequest("GET", `/api/openpix/charge/${pixCharge.charge.identifier}`);
      const openPixData = await openPixResponse.json();
      
      if (openPixData.success && openPixData.charge) {
        const charge = openPixData.charge;
        
        // Se o pagamento foi confirmado na OpenPix
        if (charge.status === 'COMPLETED' || charge.status === 'PAID') {
          console.log('Pagamento confirmado na OpenPix:', charge.status);
          
          // Aguardar um pouco para o processamento interno
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar novamente se a assinatura foi ativada
          const finalUserResponse = await apiRequest("GET", "/api/user");
          const finalUserData = await finalUserResponse.json();
          
          if (finalUserData.subscriptionActive === true) {
            console.log('Assinatura ativada com sucesso!');
            
            // Evitar redirecionamento múltiplo
            if (isRedirecting) {
              console.log('Redirecionamento já em andamento, ignorando...');
              return;
            }
            
            setIsRedirecting(true);
            setPaymentStatus('completed');
            
            // Limpar intervalo
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            toast({
              title: "Pagamento confirmado!",
              description: "Sua assinatura foi ativada com sucesso. Redirecionando...",
            });
            
            // Redirecionar para HOME
            setTimeout(() => {
              console.log('Redirecionando para /home...');
              navigate("/home");
            }, 500);
            
            return;
          }
        }
      }
      
      // Fallback: verificar nossos pagamentos locais
      const response = await apiRequest("GET", "/api/openpix/my-payments");
      const localData = await response.json();
      
      if (localData.success && localData.payments) {
        const currentPayment = localData.payments.find(
          (payment: any) => payment.openPixChargeId === pixCharge.charge.identifier
        );
        
        if (currentPayment?.status === 'COMPLETED' && currentPayment?.subscriptionActivated) {
          setPaymentStatus('completed');
          
          // Limpar intervalo
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          toast({
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada com sucesso. Redirecionando...",
          });
          
          // Redirecionar para HOME após 1 segundo
          setTimeout(() => {
            navigate("/home");
          }, 1000);
          
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Iniciar monitoramento quando PIX for criado
  useEffect(() => {
    if (pixCharge?.charge?.identifier && paymentStatus === 'processing') {
      // Verificar imediatamente
      checkPaymentStatus();
      
      // Configurar verificação automática a cada 3 segundos (reduzido de 2 para 3)
      intervalRef.current = setInterval(checkPaymentStatus, 3000);
      
      // Timeout de segurança - parar verificação após 10 minutos
      const timeoutId = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          console.log('Timeout de verificação atingido - parando monitoramento automático');
        }
      }, 600000); // 10 minutos
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pixCharge, paymentStatus]);

  const createPixPayment = async () => {
    setIsCreatingPayment(true);
    try {
      const response = await apiRequest("POST", "/api/openpix/create-charge", {
        planType: selectedPlan,
        email: "customer@querofretes.com.br",
        name: "Assinatura QUERO FRETES"
      });
      const data = await response.json();
      
      if (response.ok) {
        setPixCharge(data);
        setPaymentStatus('processing');
        toast({
          title: "PIX gerado com sucesso",
          description: "Escaneie o QR Code ou copie o código PIX para pagar",
        });
      } else {
        throw new Error(data.details || "Erro ao criar cobrança PIX");
      }
    } catch (error: any) {
      console.error("Erro ao criar PIX:", error);
      toast({
        title: "Erro",
        description: `Falha ao gerar PIX: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const copyPixCode = async () => {
    if (pixCharge?.charge?.brCode) {
      try {
        await navigator.clipboard.writeText(pixCharge.charge.brCode);
        toast({
          title: "Código copiado",
          description: "Código PIX copiado para a área de transferência",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código",
          variant: "destructive",
        });
      }
    }
  };

  // Função para verificar status manualmente
  const manualStatusCheck = async () => {
    if (!pixCharge?.charge?.identifier) return;

    setIsManualCheck(true);
    try {
      console.log('Verificação manual iniciada para:', pixCharge.charge.identifier);

      const response = await apiRequest("POST", `/api/openpix/force-sync/${pixCharge.charge.identifier}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Pagamento processado com sucesso!');
        setPaymentStatus('completed');
        
        // Limpar intervalo automático
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        toast({
          title: "Pagamento confirmado!",
          description: "Sua assinatura foi ativada com sucesso. Redirecionando...",
        });
        
        // Redirecionar para home
        setTimeout(() => {
          console.log('Redirecionando para /home...');
          navigate("/home");
        }, 1000);
      } else {
        toast({
          title: "Pagamento pendente",
          description: data.message || "Pagamento ainda não foi confirmado",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Erro na verificação manual:', error);
      toast({
        title: "Erro na verificação",
        description: "Erro ao verificar status do pagamento",
        variant: "destructive",
      });
    } finally {
      setIsManualCheck(false);
    }
  };

  // Função para simular pagamento (apenas em desenvolvimento)
  const simulateTestPayment = async () => {
    if (!pixCharge?.charge?.identifier) return;
    
    setIsSimulating(true);
    try {
      console.log('Simulando pagamento para cobrança:', pixCharge.charge.identifier);
      
      const response = await apiRequest("POST", "/api/openpix/simulate-payment", {
        chargeId: pixCharge.charge.identifier,
        paymentValue: 4990
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Pagamento simulado com sucesso!');
        setPaymentStatus('completed');
        
        // Limpar intervalo automático
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        toast({
          title: "Pagamento simulado!",
          description: "Simulação concluída. Redirecionando para home...",
        });
        
        // Redirecionar para home
        setTimeout(() => {
          console.log('Redirecionando para /home...');
          navigate("/home");
        }, 1000);
      } else {
        throw new Error(data.details || "Erro ao simular pagamento");
      }
    } catch (error: any) {
      console.error('Erro na simulação:', error);
      toast({
        title: "Erro na simulação",
        description: error.message || "Erro ao simular pagamento",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Finalizar Assinatura</h1>
          <p className="text-muted-foreground">
            Complete seu pagamento para acessar todos os recursos do QUERO FRETES
          </p>
        </div>

        {/* Plan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {currentPlan.name}
              <Badge variant="secondary">{currentPlan.price}</Badge>
            </CardTitle>
            <CardDescription>{currentPlan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total a pagar:</span>
              <span className="text-2xl font-bold">{currentPlan.price}</span>
            </div>
            {selectedPlan === 'annual' && (
              <div className="mt-2">
                <Badge variant="outline" className="text-green-600">
                  Economia de R$ 99,80
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        {!pixCharge ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Pagamento via PIX
              </CardTitle>
              <CardDescription>
                Pague instantaneamente com PIX - rápido, seguro e sem taxas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <p className="text-sm">Gerar QR Code</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <p className="text-sm">Escanear no App</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                    <p className="text-sm">Pagamento Aprovado</p>
                  </div>
                </div>
                
                <Button 
                  onClick={createPixPayment} 
                  disabled={isCreatingPayment}
                  className="w-full"
                  size="lg"
                >
                  {isCreatingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar PIX - {currentPlan.price}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* PIX Payment Display */
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                <Check className="h-6 w-6 inline mr-2" />
                PIX Gerado com Sucesso
              </CardTitle>
              <CardDescription className="text-center">
                Escaneie o QR Code ou copie o código PIX para completar o pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* QR Code */}
                <div className="flex flex-col items-center space-y-4">
                  <h3 className="font-semibold">QR Code PIX</h3>
                  {pixCharge.charge?.qrCodeImage ? (
                    <div className="space-y-2">
                      <img 
                        src={pixCharge.charge.qrCodeImage} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 border rounded-lg"
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        Abra o app do seu banco e escaneie o código
                      </p>
                    </div>
                  ) : (
                    <div className="w-48 h-48 border rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">Carregando QR Code...</span>
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informações do Pagamento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor:</span>
                      <span className="font-semibold">{currentPlan.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plano:</span>
                      <span>{currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      {paymentStatus === 'processing' ? (
                        <Badge variant="outline" className="text-blue-600">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Verificando Pagamento
                        </Badge>
                      ) : paymentStatus === 'completed' ? (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Pagamento Confirmado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">
                          Aguardando Pagamento
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* PIX Code */}
                  {pixCharge.charge?.brCode && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Código PIX (Copia e Cola):</label>
                      <div className="flex gap-2">
                        <textarea 
                          className="flex-1 p-2 text-xs border rounded resize-none h-20"
                          value={pixCharge.charge.brCode}
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyPixCode}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Payment Link */}
                  {pixCharge.charge?.paymentLinkUrl && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(pixCharge.charge.paymentLinkUrl, '_blank')}
                    >
                      Abrir Link de Pagamento
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Check */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Após o pagamento, sua assinatura será ativada automaticamente.
                  Você receberá uma confirmação por email.
                </p>
                
                {/* Botão de verificação manual */}
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={manualStatusCheck}
                    disabled={isManualCheck || paymentStatus === 'completed'}
                    className="text-xs"
                  >
                    {isManualCheck ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar Status do Pagamento"
                    )}
                  </Button>
                  
                  {pixCharge.charge?.identifier && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={simulateTestPayment}
                      disabled={isSimulating || paymentStatus === 'completed'}
                      className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Simulando...
                        </>
                      ) : (
                        "🧪 Simular Pagamento"
                      )}
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Se você já pagou, clique no botão acima para verificar
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Note */}
        <div className="text-center text-xs text-muted-foreground">
          <p>🔒 Pagamento processado de forma segura via OpenPix</p>
          <p>Seus dados estão protegidos com criptografia de ponta a ponta</p>
        </div>
      </div>
    </div>
  );
}
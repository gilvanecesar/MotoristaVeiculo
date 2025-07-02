import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, QrCode, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PixCharge {
  id: string;
  correlationID: string;
  value: number;
  status: string;
  paymentUrl: string;
  qrCode: string;
  pixCode: string;
  comment: string;
}

export default function OpenPixPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'mensal'>('mensal');
  const [isCreating, setIsCreating] = useState(false);
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [copied, setCopied] = useState(false);

  const planValues = {
    mensal: 49.90
  };

  const createPixCharge = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/openpix/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType: selectedPlan }),
      });

      const data = await response.json();

      if (data.success) {
        setCharge(data.charge);
        toast({
          title: "Cobrança PIX criada",
          description: "Use o QR Code ou código PIX para pagar",
        });
      } else {
        throw new Error(data.details || 'Erro ao criar cobrança');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a cobrança PIX",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyPixCode = async () => {
    if (charge?.pixCode) {
      await navigator.clipboard.writeText(charge.pixCode);
      setCopied(true);
      toast({
        title: "Código copiado",
        description: "Código PIX copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Faça login para acessar esta página
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Pagamento via PIX</h1>
        <p className="text-muted-foreground">
          Pague sua assinatura de forma rápida e segura com PIX através do OpenPix
        </p>
      </div>

      {!charge ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Seleção de plano */}
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPlan === 'mensal' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPlan('mensal')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Plano Mensal</h3>
                    <p className="text-sm text-muted-foreground">
                      Renovação automática todo mês
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      R$ {planValues.mensal.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPlan === 'anual' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPlan('anual')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Plano Anual</h3>
                    <p className="text-sm text-muted-foreground">
                      Economize 20% pagando anualmente
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      2 meses grátis
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      R$ {planValues.anual.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">/ano</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={createPixCharge}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando cobrança...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Informações sobre PIX */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Sobre o PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Vantagens do PIX</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Pagamento instantâneo 24/7</li>
                  <li>• Sem taxas adicionais</li>
                  <li>• Ativação imediata da assinatura</li>
                  <li>• Seguro e rastreável</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Como funciona</h4>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Escolha seu plano</li>
                  <li>2. Gere o código PIX</li>
                  <li>3. Pague pelo app do seu banco</li>
                  <li>4. Assinatura ativada automaticamente</li>
                </ol>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Powered by OpenPix - Processamento seguro de pagamentos PIX
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Exibir QR Code e código PIX */
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Pague com PIX</CardTitle>
              <p className="text-muted-foreground">
                {charge.comment} - R$ {charge.value.toFixed(2)}
              </p>
              <Badge variant="outline">{charge.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <img 
                  src={charge.qrCode} 
                  alt="QR Code PIX" 
                  className="mx-auto max-w-64 w-full border rounded-lg"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Escaneie com o app do seu banco
                </p>
              </div>

              {/* Código PIX */}
              <div>
                <label className="text-sm font-medium">Código PIX (Pix Copia e Cola)</label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={charge.pixCode}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPixCode}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Copie e cole no app do seu banco
                </p>
              </div>

              {/* Instruções */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha PIX</li>
                  <li>3. Escaneie o QR Code ou cole o código</li>
                  <li>4. Confirme o pagamento</li>
                  <li>5. Sua assinatura será ativada automaticamente</li>
                </ol>
              </div>

              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCharge(null);
                    setSelectedPlan('mensal');
                  }}
                >
                  Gerar nova cobrança
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
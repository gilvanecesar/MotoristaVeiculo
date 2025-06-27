import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function SubscriptionStatusPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Calcular dias restantes
  const getDaysRemaining = () => {
    if (!user?.subscriptionExpiresAt) return 0;
    const expirationDate = new Date(user.subscriptionExpiresAt);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();
  const isActive = user?.subscriptionActive || false;
  const hasExpiredSubscription = user?.subscriptionExpiresAt && !isActive;
  const expirationDate = user?.subscriptionExpiresAt ? 
    format(new Date(user.subscriptionExpiresAt), 'dd/MM/yyyy', { locale: pt }) : 
    'N/A';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e acompanhe o status dos pagamentos
        </p>
      </div>

      {/* Status da Assinatura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status da Assinatura
              </CardTitle>
              <CardDescription>
                Informações detalhadas sobre sua assinatura atual
              </CardDescription>
            </div>
            <div>
              {isActive ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativa
                </Badge>
              ) : hasExpiredSubscription ? (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Expirada
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Inativa
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isActive ? (
            <>
              {/* Informações da Assinatura Ativa */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Tipo de Plano
                  </div>
                  <div className="text-2xl font-bold">Mensal</div>
                  <div className="text-sm text-muted-foreground">
                    Acesso por 30 dias
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Data de Expiração
                  </div>
                  <div className="text-2xl font-bold">{expirationDate}</div>
                  <div className="text-sm text-muted-foreground">
                    {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expirado'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Valor Pago
                  </div>
                  <div className="text-2xl font-bold text-primary">R$ 49,90</div>
                  <div className="text-sm text-muted-foreground">
                    Pagamento via PIX
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Detalhes da Assinatura</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de Pagamento:</span>
                    <span className="font-medium">PIX (OpenPix)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-green-600">Confirmado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renovação:</span>
                    <span className="font-medium">Manual</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Usuário:</span>
                    <span className="font-medium capitalize">{user?.profileType}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => navigate('/invoices')}
                  variant="outline"
                  className="flex-1"
                >
                  Ver Faturas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                {daysRemaining <= 7 && (
                  <Button 
                    onClick={() => navigate('/checkout?plan=monthly')}
                    className="flex-1"
                  >
                    Renovar Assinatura
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          ) : hasExpiredSubscription ? (
            /* Assinatura Expirada */
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Tipo de Plano
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">Mensal</div>
                  <div className="text-sm text-red-600">
                    Expirado
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Data de Expiração
                  </div>
                  <div className="text-2xl font-bold text-red-600">{expirationDate}</div>
                  <div className="text-sm text-red-600">
                    Expirou há {Math.abs(daysRemaining)} dias
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Renovação
                  </div>
                  <div className="text-2xl font-bold text-primary">R$ 49,90</div>
                  <div className="text-sm text-muted-foreground">
                    Pagamento via PIX
                  </div>
                </div>
              </div>

              {/* Informações da Assinatura Expirada */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Detalhes da Assinatura Anterior</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Assinatura:</span>
                    <span className="font-medium">Mensal (30 dias)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-red-600">Expirada</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de Pagamento:</span>
                    <span className="font-medium">PIX (OpenPix)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Usuário:</span>
                    <span className="font-medium capitalize">{user?.profileType}</span>
                  </div>
                </div>
              </div>

              {/* Ações para Renovação */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => navigate('/invoices')}
                  variant="outline"
                  className="flex-1"
                >
                  Ver Histórico
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  onClick={() => navigate('/checkout?plan=monthly')}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Renovar - Gerar QR Code
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            /* Nunca teve assinatura */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Nenhuma Assinatura</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Você ainda não possui uma assinatura. Assine agora para ter acesso completo ao sistema.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/checkout?plan=monthly')}
                size="lg"
                className="mt-6"
              >
                Assinar Agora - R$ 49,90
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso de Expiração */}
      {isActive && daysRemaining <= 7 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">
                  Sua assinatura expira em {daysRemaining} dias
                </h3>
                <p className="text-sm text-yellow-700">
                  Renove sua assinatura para manter o acesso a todos os recursos.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/checkout?plan=monthly')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Renovar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso de Assinatura Expirada */}
      {hasExpiredSubscription && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  Assinatura Expirada
                </h3>
                <p className="text-sm text-red-700">
                  Sua assinatura expirou em {expirationDate}. Renove agora para recuperar o acesso completo ao sistema.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/checkout?plan=monthly')}
                className="bg-red-600 hover:bg-red-700"
              >
                Gerar QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
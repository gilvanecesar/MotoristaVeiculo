import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle } from 'lucide-react';

interface MercadoPagoButtonProps {
  planType: 'monthly' | 'yearly' | 'annual';
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

export function MercadoPagoButton({ 
  planType, 
  onSuccess, 
  className = '',
  variant = 'default'
}: MercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimulateOption, setShowSimulateOption] = useState(false);
  const { toast } = useToast();

  // Determinar se estamos em ambiente de desenvolvimento
  const isDev = process.env.NODE_ENV !== 'production' || window.location.hostname.includes('replit');

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      // Converter 'annual' para 'yearly' para compatibilidade com o backend
      const normalizedPlanType = planType === 'annual' ? 'yearly' : planType;
      
      // Valores baseados no plano
      const amount = normalizedPlanType === 'monthly' ? '99.90' : '960.00';
      const title = normalizedPlanType === 'monthly' ? 'Assinatura Mensal - QueroFretes' : 'Assinatura Anual - QueroFretes';
      const description = normalizedPlanType === 'monthly' 
        ? 'Assinatura mensal da plataforma QueroFretes' 
        : 'Assinatura anual da plataforma QueroFretes';
      
      const response = await apiRequest('POST', '/api/mercadopago/create-payment', {
        planType: normalizedPlanType,
        title,
        amount,
        description
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resposta da API:', data);
        
        // Redirecionar para a página de pagamento do Mercado Pago
        if (data.url) {
          window.location.href = data.url;
          if (onSuccess) {
            onSuccess();
          }
        } else {
          console.error('Dados recebidos sem URL:', data);
          throw new Error('Link de pagamento não recebido');
        }
      } else {
        const errorData = await response.json();
        // Se receber erro específico do Mercado Pago sobre "pagar para si mesmo", 
        // mostrar opção para simular pagamento em ambiente de desenvolvimento
        if (isDev && (errorData.message?.includes('pagar para você mesmo') || 
                      errorData.message?.includes('Erro ao criar pagamento'))) {
          setShowSimulateOption(true);
          throw new Error('Erro no Mercado Pago: Como estamos em ambiente de desenvolvimento, você pode usar a opção "Simular Pagamento" abaixo');
        } else {
          throw new Error(errorData.message || 'Erro ao criar pagamento');
        }
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast({
        title: 'Erro no pagamento',
        description: error instanceof Error ? error.message : 'Erro ao processar pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    try {
      setIsSimulating(true);
      
      // Converter 'annual' para 'yearly' para compatibilidade com o backend
      const normalizedPlanType = planType === 'annual' ? 'yearly' : planType;
      
      const response = await apiRequest('POST', '/api/mercadopago/simulate-payment', {
        planType: normalizedPlanType
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resposta da simulação:', data);
        
        toast({
          title: 'Pagamento simulado com sucesso',
          description: 'Sua assinatura foi ativada em modo de simulação',
          variant: 'default',
        });
        
        // Redirecionar para a página inicial após 2 segundos
        setTimeout(() => {
          window.location.href = '/home';
        }, 2000);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao simular pagamento');
      }
    } catch (error) {
      console.error('Erro na simulação:', error);
      toast({
        title: 'Erro na simulação',
        description: error instanceof Error ? error.message : 'Erro ao simular pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button 
        onClick={handleSubscribe} 
        disabled={isLoading}
        className={className}
        variant={variant}
      >
        {isLoading ? 'Processando...' : 'Pagar com Mercado Pago'}
      </Button>
      
      {showSimulateOption && isDev && (
        <div className="space-y-2">
          <div className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-800 text-sm flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              Em ambiente de desenvolvimento, você pode simular um pagamento para testar o fluxo completo.
            </span>
          </div>
          <Button 
            onClick={handleSimulatePayment} 
            disabled={isSimulating}
            className={className}
            variant="outline"
          >
            {isSimulating ? 'Simulando...' : 'Simular Pagamento (Dev)'}
          </Button>
        </div>
      )}
    </div>
  );
}
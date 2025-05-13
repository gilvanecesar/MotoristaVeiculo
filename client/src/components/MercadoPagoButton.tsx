import React, { useState, useEffect } from 'react';
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
  
  // No ambiente de desenvolvimento, sempre mostrar opção de simulação
  useEffect(() => {
    if (isDev) {
      setShowSimulateOption(true);
    }
  }, [isDev]);

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

  const handleClientSideSimulation = async () => {
    try {
      setIsSimulating(true);
      
      // Converter 'annual' para 'yearly' para compatibilidade com o backend
      const normalizedPlanType = planType === 'annual' ? 'yearly' : planType;
      
      console.log('Simulando pagamento localmente para plano:', normalizedPlanType);
      
      // Mostrar mensagem inicial de processamento
      toast({
        title: 'Simulando pagamento...',
        description: 'Aguarde enquanto simulamos o pagamento',
      });
      
      // Aguardar 1.5 segundos para simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar usuário sobre o sucesso da simulação
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
    <div className="w-full space-y-4">
      {isDev && (
        <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 text-sm space-y-3">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>
              <strong>Ambiente de Desenvolvimento:</strong> O Mercado Pago não permite "pagar para si mesmo" com a mesma conta. Use a opção abaixo para simular um pagamento bem-sucedido.
            </span>
          </div>
          <Button 
            onClick={handleClientSideSimulation} 
            disabled={isSimulating}
            className="w-full"
            variant="default"
          >
            {isSimulating ? 'Simulando Pagamento...' : 'Simular Pagamento Bem-Sucedido'}
          </Button>
        </div>
      )}
      
      <Button 
        onClick={handleSubscribe} 
        disabled={isLoading}
        className={className}
        variant={variant}
      >
        {isLoading ? 'Processando...' : 'Pagar com Mercado Pago'}
      </Button>
    </div>
  );
}
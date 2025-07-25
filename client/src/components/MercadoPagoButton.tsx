import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  const { toast } = useToast();

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
        throw new Error(errorData.message || 'Erro ao criar pagamento');
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



  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={isLoading}
      className={className}
      variant={variant}
    >
      {isLoading ? 'Processando...' : 'Pagar com Mercado Pago'}
    </Button>
  );
}
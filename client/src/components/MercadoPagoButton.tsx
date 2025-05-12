import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface MercadoPagoButtonProps {
  planType: 'monthly' | 'yearly';
  className?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
}

export default function MercadoPagoButton({ 
  planType, 
  className,
  variant = 'default'
}: MercadoPagoButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleClick = async () => {
    try {
      setLoading(true);
      
      // Criar preferência de pagamento no Mercado Pago
      const response = await apiRequest('POST', '/api/mercadopago/create-payment', {
        planType
      });
      
      const data = await response.json();
      
      if (data.url) {
        // Redirecionar para página de pagamento do Mercado Pago
        window.location.href = data.url;
      } else {
        throw new Error('URL de pagamento não disponível');
      }
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: 'Erro ao iniciar pagamento',
        description: error.message || 'Não foi possível iniciar o pagamento. Por favor, tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      className={className}
      variant={variant}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>Assinar com Mercado Pago</>
      )}
    </Button>
  );
}
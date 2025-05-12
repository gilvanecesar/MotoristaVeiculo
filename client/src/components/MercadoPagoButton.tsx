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
      
      // Logar informações úteis para depuração
      console.log('Iniciando processamento de pagamento Mercado Pago para plano:', planType);
      
      // Criar preferência de pagamento no Mercado Pago
      const response = await apiRequest('POST', '/api/mercadopago/create-payment', {
        // Converter para o formato que o backend espera
        planType: planType === 'monthly' ? 'monthly' : 'yearly'
      });
      
      // Verificar resposta
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na resposta da API:', errorData);
        throw new Error(errorData.error?.message || 'Falha na comunicação com o servidor');
      }
      
      const data = await response.json();
      console.log('Resposta do servidor:', data);
      
      if (data.url) {
        // Mostrar mensagem de sucesso
        toast({
          title: 'Redirecionando para pagamento',
          description: 'Você será redirecionado para a página de pagamento do Mercado Pago.',
          variant: 'default'
        });
        
        // Redirecionar para página de pagamento do Mercado Pago
        window.location.href = data.url;
      } else {
        console.error('Dados de resposta inválidos:', data);
        throw new Error('URL de pagamento não disponível na resposta');
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
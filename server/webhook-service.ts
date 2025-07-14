import { Request, Response } from "express";
// import { whatsappService } from "./whatsapp-service";

interface WebhookConfig {
  enabled: boolean;
  url: string;
  groupIds: string[];
  minFreightValue?: number;
  allowedRoutes?: string[];
  useDirectWhatsApp?: boolean;
  whatsappGroups?: string[];
}

// Configuração padrão do webhook (será salva no banco posteriormente)
let webhookConfig: WebhookConfig = {
  enabled: false,
  url: "",
  groupIds: [],
  minFreightValue: 0,
  allowedRoutes: [],
  useDirectWhatsApp: false,
  whatsappGroups: []
};

/**
 * Formata dados do frete para envio via webhook
 */
export function formatFreightForWebhook(freight: any, client: any) {
  // Formatação dos destinos
  let destinosText = `🏁 *Destino:* ${freight.destination}, ${freight.destinationState}`;
  
  if (freight.destination1) {
    destinosText += `\n🏁 *Destino 2:* ${freight.destination1}, ${freight.destinationState1}`;
  }
  
  if (freight.destination2) {
    destinosText += `\n🏁 *Destino 3:* ${freight.destination2}, ${freight.destinationState2}`;
  }

  // Formatar valor
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  // Formatar data
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatar tipos de veículo
  const formatMultipleVehicleTypes = (freight: any) => {
    if (freight.vehicleTypesSelected) {
      return freight.vehicleTypesSelected.split(',').map((type: string) => type.trim()).join(', ');
    }
    return freight.vehicleType || 'Não especificado';
  };

  // Formatar tipos de carroceria
  const formatMultipleBodyTypes = (freight: any) => {
    if (freight.bodyTypesSelected) {
      return freight.bodyTypesSelected.split(',').map((type: string) => type.trim()).join(', ');
    }
    return freight.bodyType || 'Não especificado';
  };

  // Categoria do veículo
  const getVehicleCategory = (vehicleType: string) => {
    if (!vehicleType) return 'Não especificado';
    
    const lightVehicles = ['van', 'utilitario', 'pickup'];
    const mediumVehicles = ['3_4', 'toco'];
    const heavyVehicles = ['truck', 'bitruck', 'carreta', 'bicarreta'];
    
    const type = vehicleType.toLowerCase();
    
    if (lightVehicles.some(v => type.includes(v))) return 'Leve';
    if (mediumVehicles.some(v => type.includes(v))) return 'Médio';
    if (heavyVehicles.some(v => type.includes(v))) return 'Pesado';
    
    return 'Não especificado';
  };

  const message = `🚛 *FRETE DISPONÍVEL* 🚛

🏢 *${client?.name || 'Cliente não encontrado'}*
📍 *Origem:* ${freight.origin}, ${freight.originState}
${destinosText}
🚚 *Categoria:* ${getVehicleCategory(freight.vehicleType)}
🚚 *Veículo:* ${formatMultipleVehicleTypes(freight)}
🚐 *Carroceria:* ${formatMultipleBodyTypes(freight)}
📦 *Tipo de Carga:* ${freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}
⚖️ *Peso:* ${freight.cargoWeight} Kg
💰 *Pagamento:* ${freight.paymentMethod}
💵 *Valor:* ${formatCurrency(freight.freightValue)}



👤 *Contato:* ${freight.contactName}
📞 *Telefone:* ${freight.contactPhone}
${freight.observations ? `\n📝 *Observações:* ${freight.observations}\n` : ''}
🌐 *Sistema QUERO FRETES:* https://querofretes.com.br
🔗 *Link do frete:* ${process.env.NODE_ENV === 'production' ? 'https://querofretes.com.br' : 'http://localhost:5000'}/freight/${freight.id}`;

  return {
    freightId: freight.id,
    message,
    freight: {
      id: freight.id,
      origin: `${freight.origin}, ${freight.originState}`,
      destination: `${freight.destination}, ${freight.destinationState}`,
      value: parseFloat(freight.freightValue || '0'),
      clientName: client?.name || 'Cliente não encontrado',
      contactName: freight.contactName,
      contactPhone: freight.contactPhone,
      createdAt: freight.createdAt,
      expirationDate: freight.expirationDate
    },
    groupIds: webhookConfig.groupIds
  };
}

/**
 * Envia webhook e/ou WhatsApp direto após cadastro de frete
 */
export async function sendFreightWebhook(freight: any, client: any) {
  if (!webhookConfig.enabled) {
    console.log('Envio automático desabilitado');
    return false;
  }

  // Verificar valor mínimo se configurado
  if (webhookConfig.minFreightValue && parseFloat(freight.freightValue || '0') < webhookConfig.minFreightValue) {
    console.log(`Frete abaixo do valor mínimo configurado: R$ ${freight.freightValue}`);
    return false;
  }

  const webhookData = formatFreightForWebhook(freight, client);
  let webhookSuccess = false;
  let whatsappSuccess = false;

  // Enviar via webhook (Zapier/Make) se configurado
  if (webhookConfig.url) {
    try {
      const response = await fetch(webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        console.log(`Webhook enviado com sucesso para frete ${freight.id}`);
        webhookSuccess = true;
      } else {
        console.error(`Erro ao enviar webhook: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
    }
  }

  // Enviar via WhatsApp direto se configurado (funcionalidade futura)
  if (webhookConfig.useDirectWhatsApp && webhookConfig.whatsappGroups && webhookConfig.whatsappGroups.length > 0) {
    console.log('WhatsApp direto: funcionalidade será implementada em próxima versão');
    // Funcionalidade do WhatsApp será implementada futuramente
    whatsappSuccess = false;
  }

  return webhookSuccess || whatsappSuccess;
}

/**
 * Configurar webhook
 */
export function setWebhookConfig(config: Partial<WebhookConfig>) {
  webhookConfig = { ...webhookConfig, ...config };
  console.log('Configuração do webhook atualizada:', webhookConfig);
}

/**
 * Obter configuração atual do webhook
 */
export function getWebhookConfig(): WebhookConfig {
  return { ...webhookConfig };
}

/**
 * Rotas para gerenciar webhook
 */
export function setupWebhookRoutes(app: any) {
  // Obter configuração do webhook
  app.get('/api/webhook/config', (req: Request, res: Response) => {
    res.json(getWebhookConfig());
  });

  // Atualizar configuração do webhook
  app.post('/api/webhook/config', (req: Request, res: Response) => {
    try {
      const config = req.body;
      setWebhookConfig(config);
      res.json({ success: true, config: getWebhookConfig() });
    } catch (error) {
      console.error('Erro ao atualizar configuração do webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Testar webhook
  app.post('/api/webhook/test', async (req: Request, res: Response) => {
    try {
      const testData = {
        freightId: 'TEST',
        message: '🧪 *TESTE DE WEBHOOK* 🧪\n\nEste é um teste de configuração do webhook para envio automático de fretes.',
        freight: {
          id: 'TEST',
          origin: 'Cidade Teste, TS',
          destination: 'Destino Teste, TD',
          value: 1000,
          clientName: 'Cliente Teste',
          contactName: 'Contato Teste',
          contactPhone: '(11) 99999-9999',
          createdAt: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        groupIds: webhookConfig.groupIds
      };

      if (!webhookConfig.url) {
        return res.status(400).json({ error: 'URL do webhook não configurada' });
      }

      const response = await fetch(webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        res.json({ success: true, message: 'Webhook de teste enviado com sucesso' });
      } else {
        res.status(500).json({ 
          error: `Erro no webhook: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      res.status(500).json({ error: 'Erro ao enviar webhook de teste' });
    }
  });
}
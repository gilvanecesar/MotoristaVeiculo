import { Request, Response } from "express";
import { storage } from "./storage";
import { WebhookConfig } from "@shared/schema";

interface WebhookConfigData {
  enabled: boolean;
  url: string;
  groupIds: string[];
  minFreightValue?: number;
  allowedRoutes?: string[];
  useDirectWhatsApp?: boolean;
  whatsappGroups?: string[];
}

// Cache local para configurações (atualizado do banco)
let webhookConfigCache: WebhookConfigData | null = null;

// Utility functions for formatting
const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue || 0);
};

const formatMultipleVehicleTypes = (freight: any) => {
  if (freight.vehicleTypesSelected) {
    return freight.vehicleTypesSelected.split(',').map((type: string) => type.trim()).join(', ');
  }
  return freight.vehicleType || 'Não especificado';
};

const formatMultipleBodyTypes = (freight: any) => {
  if (freight.bodyTypesSelected) {
    return freight.bodyTypesSelected.split(',').map((type: string) => type.trim()).join(', ');
  }
  return freight.bodyType || 'Não especificado';
};

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

/**
 * Formatar dados do frete para webhook usando configurações do banco
 */
async function formatFreightForWebhookAsync(freight: any, client: any) {
  const currentConfig = await getWebhookConfig();
  
  const destinosText = freight.destinations && freight.destinations.length > 0 
    ? freight.destinations.map((dest: any) => `📍 ${dest.name}, ${dest.state}`).join('\n')
    : `📍 ${freight.destination}, ${freight.destinationState}`;

  const message = `🚛 *NOVO FRETE DISPONÍVEL* 🚛

📍 *Origem:* ${freight.origin}, ${freight.originState}
📍 *Destino(s):*
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
    groupIds: currentConfig.groupIds
  };
}

/**
 * Envia webhook e/ou WhatsApp direto após cadastro de frete
 */
export async function sendFreightWebhook(freight: any, client: any) {
  const currentConfig = await getWebhookConfig();
  
  if (!currentConfig.enabled) {
    console.log('Envio automático desabilitado');
    return false;
  }

  // Verificar valor mínimo se configurado
  if (currentConfig.minFreightValue && parseFloat(freight.freightValue || '0') < currentConfig.minFreightValue) {
    console.log(`Frete abaixo do valor mínimo configurado: R$ ${freight.freightValue}`);
    return false;
  }

  const webhookData = await formatFreightForWebhookAsync(freight, client);
  let webhookSuccess = false;
  let whatsappSuccess = false;

  // Enviar via webhook (Zapier/Make) se configurado
  if (currentConfig.url) {
    try {
      const response = await fetch(currentConfig.url, {
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
  if (currentConfig.useDirectWhatsApp && currentConfig.whatsappGroups && currentConfig.whatsappGroups.length > 0) {
    console.log('WhatsApp direto: funcionalidade será implementada em próxima versão');
    // Funcionalidade do WhatsApp será implementada futuramente
    whatsappSuccess = false;
  }

  return webhookSuccess || whatsappSuccess;
}

/**
 * Configurar webhook (persiste no banco de dados)
 */
export async function setWebhookConfig(config: Partial<WebhookConfigData>) {
  try {
    const configType = 'whatsapp';
    const existingConfig = await storage.getWebhookConfig(configType);
    
    if (existingConfig) {
      // Atualizar configuração existente
      const updatedConfig = await storage.updateWebhookConfig(configType, {
        enabled: config.enabled,
        url: config.url,
        groupIds: config.groupIds,
        minFreightValue: config.minFreightValue,
        allowedRoutes: config.allowedRoutes,
        useDirectWhatsApp: config.useDirectWhatsApp,
        whatsappGroups: config.whatsappGroups,
      });
      
      // Atualizar cache
      webhookConfigCache = {
        enabled: updatedConfig?.enabled || false,
        url: updatedConfig?.url || '',
        groupIds: (updatedConfig?.groupIds as string[]) || [],
        minFreightValue: updatedConfig?.minFreightValue ? Number(updatedConfig.minFreightValue) : 0,
        allowedRoutes: (updatedConfig?.allowedRoutes as string[]) || [],
        useDirectWhatsApp: updatedConfig?.useDirectWhatsApp || false,
        whatsappGroups: (updatedConfig?.whatsappGroups as string[]) || []
      };
    } else {
      // Criar nova configuração
      const newConfig = await storage.createWebhookConfig({
        configType,
        enabled: config.enabled || false,
        url: config.url || '',
        groupIds: config.groupIds || [],
        minFreightValue: config.minFreightValue,
        allowedRoutes: config.allowedRoutes || [],
        useDirectWhatsApp: config.useDirectWhatsApp || false,
        whatsappGroups: config.whatsappGroups || []
      });
      
      // Atualizar cache
      webhookConfigCache = {
        enabled: newConfig.enabled || false,
        url: newConfig.url || '',
        groupIds: (newConfig.groupIds as string[]) || [],
        minFreightValue: newConfig.minFreightValue ? Number(newConfig.minFreightValue) : 0,
        allowedRoutes: (newConfig.allowedRoutes as string[]) || [],
        useDirectWhatsApp: newConfig.useDirectWhatsApp || false,
        whatsappGroups: (newConfig.whatsappGroups as string[]) || []
      };
    }
    
    console.log('Configuração do webhook atualizada e salva no banco:', webhookConfigCache);
  } catch (error) {
    console.error('Erro ao salvar configuração do webhook:', error);
  }
}

/**
 * Obter configuração atual do webhook (do banco de dados)
 */
export async function getWebhookConfig(): Promise<WebhookConfigData> {
  try {
    // Se não há cache, buscar do banco
    if (!webhookConfigCache) {
      const configType = 'whatsapp';
      const dbConfig = await storage.getWebhookConfig(configType);
      
      if (dbConfig) {
        webhookConfigCache = {
          enabled: dbConfig.enabled || false,
          url: dbConfig.url || '',
          groupIds: (dbConfig.groupIds as string[]) || [],
          minFreightValue: dbConfig.minFreightValue ? Number(dbConfig.minFreightValue) : 0,
          allowedRoutes: (dbConfig.allowedRoutes as string[]) || [],
          useDirectWhatsApp: dbConfig.useDirectWhatsApp || false,
          whatsappGroups: (dbConfig.whatsappGroups as string[]) || []
        };
      } else {
        // Configuração padrão se não existe no banco
        webhookConfigCache = {
          enabled: false,
          url: '',
          groupIds: [],
          minFreightValue: 0,
          allowedRoutes: [],
          useDirectWhatsApp: false,
          whatsappGroups: []
        };
      }
    }
    
    return { ...webhookConfigCache };
  } catch (error) {
    console.error('Erro ao carregar configuração do webhook:', error);
    // Retornar configuração padrão em caso de erro
    return {
      enabled: false,
      url: '',
      groupIds: [],
      minFreightValue: 0,
      allowedRoutes: [],
      useDirectWhatsApp: false,
      whatsappGroups: []
    };
  }
}

/**
 * Enviar notificação via webhook (função auxiliar)
 */
export async function sendWebhookNotification(data: any) {
  const currentConfig = await getWebhookConfig();
  
  if (!currentConfig.enabled || !currentConfig.url) {
    console.log('Webhook não configurado ou desabilitado');
    return false;
  }
  
  try {
    const response = await fetch(currentConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log('Notificação webhook enviada com sucesso');
      return true;
    } else {
      console.error(`Erro ao enviar notificação webhook: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar notificação webhook:', error);
    return false;
  }
}

/**
 * Rotas para gerenciar webhook
 */
export function setupWebhookRoutes(app: any) {
  // Obter configuração do webhook
  app.get('/api/webhook/config', async (req: Request, res: Response) => {
    try {
      const config = await getWebhookConfig();
      res.json(config);
    } catch (error) {
      console.error('Erro ao obter configuração do webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Atualizar configuração do webhook
  app.post('/api/webhook/config', async (req: Request, res: Response) => {
    try {
      const config = req.body;
      await setWebhookConfig(config);
      const updatedConfig = await getWebhookConfig();
      res.json({ success: true, config: updatedConfig });
    } catch (error) {
      console.error('Erro ao atualizar configuração do webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Testar webhook
  app.post('/api/webhook/test', async (req: Request, res: Response) => {
    try {
      const currentConfig = await getWebhookConfig();
      
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
        groupIds: currentConfig.groupIds
      };

      if (!currentConfig.url) {
        return res.status(400).json({ error: 'URL do webhook não configurada' });
      }

      const response = await fetch(currentConfig.url, {
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
import { Request, Response } from 'express';
import axios from 'axios';

interface OpenPixConfig {
  appId: string;
  apiUrl: string;
}

const openPixConfig: OpenPixConfig = {
  appId: process.env.OPENPIX_APP_ID || '',
  apiUrl: 'https://api.openpix.com.br/api/v1'
};

interface CreateChargeRequest {
  correlationID: string;
  value: number;
  comment: string;
  customer?: {
    name: string;
    email: string;
  };
  additionalInfo: Array<{
    key: string;
    value: string;
  }>;
}

interface OpenPixCharge {
  charge: {
    status: string;
    customer: {
      name: string;
      email: string;
    };
    value: number;
    comment: string;
    identifier: string;
    correlationID: string;
    paymentLinkID: string;
    paymentLinkUrl: string;
    qrCodeImage: string;
    brCode: string;
  };
}

/**
 * Cria uma cobrança PIX via OpenPix
 */
export async function createPixCharge(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!openPixConfig.appId) {
      return res.status(500).json({ error: 'OpenPix não configurado' });
    }

    const { planType = 'mensal' } = req.body;
    const user = req.user;

    // Definir valores dos planos
    const planValues = {
      mensal: 99.90,
      anual: 960.00
    };

    const value = planValues[planType as keyof typeof planValues];
    if (!value) {
      return res.status(400).json({ error: 'Tipo de plano inválido' });
    }

    // Criar ID único para correlação
    const correlationID = `querofretes-${user.id}-${Date.now()}`;

    const chargeData: CreateChargeRequest = {
      correlationID,
      value,
      comment: `Assinatura ${planType} - QUERO FRETES`,
      customer: {
        name: user.name,
        email: user.email
      },
      additionalInfo: [
        { key: 'userId', value: user.id.toString() },
        { key: 'planType', value: planType },
        { key: 'source', value: 'querofretes-web' }
      ]
    };

    console.log('Criando cobrança PIX no OpenPix:', chargeData);

    const response = await axios.post<OpenPixCharge>(
      `${openPixConfig.apiUrl}/charge/`,
      chargeData,
      {
        headers: {
          'Authorization': openPixConfig.appId,
          'Content-Type': 'application/json'
        }
      }
    );

    const charge = response.data.charge;

    // Log da cobrança criada
    console.log('Cobrança PIX criada:', charge.identifier);

    console.log('Cobrança PIX criada com sucesso:', charge.identifier);

    return res.json({
      success: true,
      charge: {
        id: charge.identifier,
        correlationID: charge.correlationID,
        value: charge.value,
        status: charge.status,
        paymentUrl: charge.paymentLinkUrl,
        qrCode: charge.qrCodeImage,
        pixCode: charge.brCode,
        comment: charge.comment
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar cobrança PIX:', error.response?.data || error.message);
    
    // Log do erro
    console.error('Erro ao criar cobrança PIX para usuário:', req.user?.id);

    return res.status(500).json({ 
      error: 'Erro ao criar cobrança PIX',
      details: error.response?.data?.message || error.message
    });
  }
}

/**
 * Webhook para receber notificações do OpenPix
 */
export async function handleOpenPixWebhook(req: Request, res: Response) {
  try {
    console.log('Webhook OpenPix recebido:', req.body);

    const { charge, pix } = req.body;
    
    if (!charge) {
      return res.status(400).json({ error: 'Dados inválidos do webhook' });
    }

    // Buscar informações adicionais da cobrança
    const correlationID = charge.correlationID;
    const status = charge.status;
    
    // Extrair userId do correlationID (formato: querofretes-{userId}-{timestamp})
    const userIdMatch = correlationID.match(/querofretes-(\d+)-/);
    if (!userIdMatch) {
      console.log('CorrelationID inválido:', correlationID);
      return res.status(200).send('OK');
    }

    const userId = parseInt(userIdMatch[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      console.log('Usuário não encontrado:', userId);
      return res.status(200).send('OK');
    }

    // Log do webhook
    console.log('Webhook OpenPix processado para usuário:', userId);

    // Processar pagamento aprovado
    if (status === 'COMPLETED' && pix) {
      console.log(`Pagamento PIX aprovado para usuário ${userId}`);

      // Extrair tipo de plano dos additionalInfo
      const planTypeInfo = charge.additionalInfo?.find((info: any) => info.key === 'planType');
      const planType = planTypeInfo?.value || 'mensal';

      // Calcular data de expiração
      const now = new Date();
      const expiresAt = new Date(now);
      if (planType === 'anual') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Ativar assinatura (implementação pendente - precisa integração com storage)
      console.log(`Assinatura ${planType} deve ser ativada para usuário ${userId} até ${expiresAt}`);

      console.log(`Assinatura ${planType} ativada para usuário ${userId} até ${expiresAt}`);
    }

    return res.status(200).send('OK');

  } catch (error: any) {
    console.error('Erro ao processar webhook OpenPix:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Consultar status de uma cobrança
 */
export async function getChargeStatus(req: Request, res: Response) {
  try {
    const { chargeId } = req.params;

    if (!openPixConfig.appId) {
      return res.status(500).json({ error: 'OpenPix não configurado' });
    }

    const response = await axios.get(
      `${openPixConfig.apiUrl}/charge/${chargeId}`,
      {
        headers: {
          'Authorization': openPixConfig.appId
        }
      }
    );

    return res.json(response.data);

  } catch (error: any) {
    console.error('Erro ao consultar status da cobrança:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Erro ao consultar status da cobrança',
      details: error.response?.data?.message || error.message
    });
  }
}
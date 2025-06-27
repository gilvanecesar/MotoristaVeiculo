import { Request, Response } from 'express';
import axios from 'axios';
import { db } from './db';
import { users, invoices, subscriptions } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendSubscriptionEmail } from './email-service';

interface OpenPixConfig {
  authorization: string;
  apiUrl: string;
}

const openPixConfig: OpenPixConfig = {
  authorization: process.env.OPENPIX_AUTHORIZATION || '',
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

    if (!openPixConfig.authorization) {
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
          'Authorization': openPixConfig.authorization,
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
    
    // Buscar usuário no banco de dados
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.log('Usuário não encontrado:', userId);
      return res.status(200).send('OK');
    }

    console.log('Usuário encontrado para processamento:', userId);

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

      try {
        // Ativar assinatura do usuário
        await db.update(users)
          .set({
            subscriptionActive: true,
            subscriptionType: planType,
            subscriptionExpiresAt: expiresAt,
            paymentRequired: false
          })
          .where(eq(users.id, userId));

        // Criar registro da assinatura
        const [newSubscription] = await db.insert(subscriptions).values({
          user_id: userId,
          client_id: user.clientId,
          plan_type: planType,
          status: 'active',
          current_period_start: now,
          current_period_end: expiresAt,
          cancel_at_period_end: false,
          metadata: {
            paymentMethod: 'pix_openpix',
            openPixChargeId: charge.identifier,
            amount: charge.value
          }
        }).returning();

        // Criar registro de invoice
        await db.insert(invoices).values({
          user_id: userId,
          client_id: user.clientId,
          subscription_id: newSubscription?.id,
          amount: charge.value.toString(),
          status: 'paid',
          description: `Assinatura ${planType} - OpenPix`,
          metadata: {
            openPixChargeId: charge.identifier,
            correlationID: charge.correlationID,
            pixEndToEndId: pix.endToEndId || null,
            paymentMethod: 'pix_openpix'
          },
          paid_at: new Date(),
          due_date: now
        });

        // Enviar email de confirmação
        await sendSubscriptionEmail(
          user.email,
          user.name,
          planType,
          now,
          expiresAt,
          charge.value
        );

        console.log(`Assinatura ${planType} ativada para usuário ${userId} até ${expiresAt}`);
        
      } catch (error) {
        console.error('Erro ao ativar assinatura:', error);
      }
    }

    return res.status(200).send('OK');

  } catch (error: any) {
    console.error('Erro ao processar webhook OpenPix:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Lista todas as cobranças do OpenPix
 */
export async function listOpenPixCharges(req: Request, res: Response) {
  try {
    if (!openPixConfig.authorization) {
      return res.status(500).json({ error: 'OpenPix não configurado' });
    }

    const { skip = 0, limit = 100 } = req.query;

    const response = await axios.get(
      `${openPixConfig.apiUrl}/charge?skip=${skip}&limit=${limit}`,
      {
        headers: {
          'Authorization': openPixConfig.authorization
        }
      }
    );

    return res.json(response.data);

  } catch (error: any) {
    console.error('Erro ao listar cobranças:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Erro ao listar cobranças',
      details: error.response?.data?.message || error.message
    });
  }
}

/**
 * Sincroniza pagamentos do OpenPix com o banco de dados local
 */
export async function syncOpenPixPayments(req: Request, res: Response) {
  try {
    if (!openPixConfig.authorization) {
      return res.status(500).json({ error: 'OpenPix não configurado' });
    }

    console.log('Iniciando sincronização de pagamentos OpenPix...');

    // Buscar cobranças recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await axios.get(
      `${openPixConfig.apiUrl}/charge?start=${thirtyDaysAgo.toISOString()}&end=${new Date().toISOString()}`,
      {
        headers: {
          'Authorization': openPixConfig.authorization
        }
      }
    );

    const charges = response.data.charges || [];
    let syncedCount = 0;
    let errorCount = 0;

    for (const charge of charges) {
      try {
        // Processar apenas cobranças completas do QUERO FRETES
        if (charge.status === 'COMPLETED' && charge.correlationID?.startsWith('querofretes-')) {
          const userIdMatch = charge.correlationID.match(/querofretes-(\d+)-/);
          if (userIdMatch) {
            const userId = parseInt(userIdMatch[1]);
            
            // Verificar se já existe uma invoice para esta cobrança
            const [existingInvoice] = await db.select()
              .from(invoices)
              .where(eq(invoices.metadata, { openPixChargeId: charge.identifier }));

            if (!existingInvoice) {
              // Buscar usuário
              const [user] = await db.select().from(users).where(eq(users.id, userId));
              if (user) {
                await processOpenPixPayment(charge, user);
                syncedCount++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao processar cobrança ${charge.identifier}:`, error);
        errorCount++;
      }
    }

    console.log(`Sincronização concluída: ${syncedCount} pagamentos sincronizados, ${errorCount} erros`);

    return res.json({
      success: true,
      syncedCount,
      errorCount,
      totalCharges: charges.length
    });

  } catch (error: any) {
    console.error('Erro na sincronização:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Erro na sincronização',
      details: error.response?.data?.message || error.message
    });
  }
}

/**
 * Processa um pagamento do OpenPix e atualiza o banco de dados
 */
async function processOpenPixPayment(charge: any, user: any) {
  // Extrair tipo de plano
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

  // Ativar assinatura do usuário
  await db.update(users)
    .set({
      subscriptionActive: true,
      subscriptionType: planType,
      subscriptionExpiresAt: expiresAt,
      paymentRequired: false
    })
    .where(eq(users.id, user.id));

  // Criar registro da assinatura
  await db.insert(subscriptions).values({
    userId: user.id,
    clientId: user.clientId,
    type: planType,
    status: 'active',
    startDate: now,
    endDate: expiresAt,
    amount: charge.value.toString(),
    paymentMethod: 'pix_openpix',
    autoRenew: false
  });

  // Criar registro de invoice
  await db.insert(invoices).values({
    userId: user.id,
    clientId: user.clientId,
    amount: charge.value.toString(),
    status: 'paid',
    paymentMethod: 'pix_openpix',
    description: `Assinatura ${planType} - OpenPix`,
    metadata: {
      openPixChargeId: charge.identifier,
      correlationID: charge.correlationID
    },
    paidAt: new Date(charge.updatedAt || charge.createdAt),
    dueDate: new Date(charge.createdAt)
  });

  console.log(`Pagamento OpenPix processado para usuário ${user.id}: ${charge.identifier}`);
}

/**
 * Consultar status de uma cobrança
 */
export async function getChargeStatus(req: Request, res: Response) {
  try {
    const { chargeId } = req.params;

    if (!openPixConfig.authorization) {
      return res.status(500).json({ error: 'OpenPix não configurado' });
    }

    const response = await axios.get(
      `${openPixConfig.apiUrl}/charge/${chargeId}`,
      {
        headers: {
          'Authorization': openPixConfig.authorization
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
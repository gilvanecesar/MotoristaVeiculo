import { Request, Response } from 'express';
import axios from 'axios';
import { db } from './db';
import { users, openPixPayments, OPENPIX_PAYMENT_STATUS } from '../shared/schema';
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

    // Definir valores dos planos (aceitar tanto português quanto inglês)
    const planValues = {
      mensal: 49.90,
      monthly: 49.90,
      anual: 960.00,
      yearly: 960.00,
      annual: 960.00
    };

    const value = planValues[planType as keyof typeof planValues];
    if (!value) {
      return res.status(400).json({ error: 'Tipo de plano inválido' });
    }

    // Criar ID único para correlação
    const correlationID = `querofretes-${user.id}-${Date.now()}`;

    const chargeData: CreateChargeRequest = {
      correlationID,
      value: Math.round(value * 100), // Converter para centavos
      comment: `Assinatura ${planType} - QUERO FRETES (R$ ${value.toFixed(2)})`,
      customer: {
        name: user.name,
        email: user.email
      },
      additionalInfo: [
        { key: 'userId', value: user.id.toString() },
        { key: 'planType', value: planType },
        { key: 'source', value: 'querofretes-web' },
        { key: 'valueInReais', value: value.toFixed(2) }
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

    // Salvar na tabela de controle de pagamentos
    await db.insert(openPixPayments).values({
      userId: user.id,
      openPixChargeId: charge.identifier,
      correlationId: charge.correlationID,
      status: OPENPIX_PAYMENT_STATUS.ACTIVE,
      amount: value.toString(),
      amountCents: Math.round(value * 100),
      pixCode: charge.brCode,
      qrCodeImage: charge.qrCodeImage,
      paymentUrl: charge.paymentLinkUrl,
      planType: planType === 'monthly' || planType === 'mensal' ? 'monthly' : 'annual',
      processed: false,
      subscriptionActivated: false
    });

    // Log da cobrança criada
    console.log('Cobrança PIX criada:', charge.identifier);
    console.log('Pagamento salvo no banco de dados para controle');

    return res.json({
      success: true,
      charge: {
        identifier: charge.identifier,
        correlationID: charge.correlationID,
        value: charge.value,
        status: charge.status,
        customer: charge.customer,
        comment: charge.comment,
        paymentLinkUrl: charge.paymentLinkUrl,
        qrCodeImage: charge.qrCodeImage,
        brCode: charge.brCode
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

      // Buscar pagamento na nossa tabela de controle
      const [payment] = await db
        .select()
        .from(openPixPayments)
        .where(eq(openPixPayments.correlationId, correlationID));
      
      if (!payment) {
        console.error('Pagamento não encontrado na tabela de controle:', correlationID);
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }
      
      // Verificar se já foi processado
      if (payment.processed) {
        console.log('Pagamento já processado:', correlationID);
        return res.status(200).send('OK');
      }

      // Calcular datas de assinatura (30 dias)
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30); // Sempre 30 dias

      try {
        // Atualizar tabela de pagamentos
        await db.update(openPixPayments)
          .set({
            status: OPENPIX_PAYMENT_STATUS.COMPLETED,
            processed: true,
            subscriptionActivated: true,
            paidAt: now,
            subscriptionStartDate: now,
            subscriptionEndDate: expiresAt,
            webhookData: req.body,
            updatedAt: now
          })
          .where(eq(openPixPayments.id, payment.id));

        // Ativar assinatura do usuário
        await db.update(users)
          .set({
            subscriptionActive: true,
            subscriptionType: 'monthly',
            subscriptionExpiresAt: expiresAt,
            paymentRequired: false
          })
          .where(eq(users.id, userId));

        // TODO: Corrigir campos das tabelas - problemas de TypeScript
        console.log(`Assinatura ${planType} deve ser ativada para usuário ${userId} até ${expiresAt}`);
        console.log('Registro de subscription e invoice pendente - corrigir schema');
        
        /* 
        // Criar registro da assinatura
        const [newSubscription] = await db.insert(subscriptions).values({
          userId: userId,
          clientId: user.clientId,
          planType: planType,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: expiresAt,
          cancelAtPeriodEnd: false,
          metadata: {
            paymentMethod: 'pix_openpix',
            openPixChargeId: charge.identifier,
            amount: charge.value
          }
        }).returning();

        // Criar registro de invoice
        await db.insert(invoices).values({
          userId: userId,
          clientId: user.clientId,
          subscriptionId: newSubscription?.id,
          amount: charge.value.toString(),
          status: 'paid',
          description: `Assinatura ${planType} - OpenPix`,
          metadata: {
            openPixChargeId: charge.identifier,
            correlationID: charge.correlationID,
            pixEndToEndId: pix.endToEndId || null,
            paymentMethod: 'pix_openpix'
          },
          paidAt: new Date(),
          dueDate: now
        });
        */

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
            
            // TODO: Implementar verificação de duplicatas
            console.log(`Processando cobrança ${charge.identifier} para usuário ${userId}`);
            
            // Buscar usuário
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (user) {
              await processOpenPixPayment(charge, user);
              syncedCount++;
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

  // TODO: Corrigir campos das tabelas - problemas de TypeScript
  console.log(`Processamento pendente para usuário ${user.id}: ${charge.identifier}`);
  
  /*
  // Criar registro da assinatura
  const [newSubscription] = await db.insert(subscriptions).values({
    userId: user.id,
    clientId: user.clientId,
    planType: planType,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: expiresAt,
    cancelAtPeriodEnd: false,
    metadata: {
      paymentMethod: 'pix_openpix',
      openPixChargeId: charge.identifier,
      amount: charge.value
    }
  }).returning();

  // Criar registro de invoice
  await db.insert(invoices).values({
    userId: user.id,
    clientId: user.clientId,
    subscriptionId: newSubscription?.id,
    amount: charge.value.toString(),
    status: 'paid',
    description: `Assinatura ${planType} - OpenPix`,
    metadata: {
      openPixChargeId: charge.identifier,
      correlationID: charge.correlationID,
      paymentMethod: 'pix_openpix'
    },
    paidAt: new Date(charge.updatedAt || charge.createdAt),
    dueDate: new Date(charge.createdAt)
  });
  */

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

/**
 * Consultar pagamentos do usuário na tabela local
 */
export async function getUserPayments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const payments = await db
      .select()
      .from(openPixPayments)
      .where(eq(openPixPayments.userId, req.user.id))
      .orderBy(openPixPayments.createdAt);

    return res.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        openPixChargeId: payment.openPixChargeId,
        correlationId: payment.correlationId,
        status: payment.status,
        amount: payment.amount,
        amountCents: payment.amountCents,
        planType: payment.planType,
        processed: payment.processed,
        subscriptionActivated: payment.subscriptionActivated,
        paidAt: payment.paidAt,
        subscriptionStartDate: payment.subscriptionStartDate,
        subscriptionEndDate: payment.subscriptionEndDate,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        paymentUrl: payment.paymentUrl
      }))
    });

  } catch (error: any) {
    console.error('Erro ao consultar pagamentos do usuário:', error);
    return res.status(500).json({ 
      error: 'Erro ao consultar pagamentos',
      details: error.message
    });
  }
}
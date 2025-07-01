import { Request, Response } from 'express';
import axios from 'axios';
import { db } from './db';
import { users, openPixPayments, subscriptions, OPENPIX_PAYMENT_STATUS } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendSubscriptionEmail, sendSubscriptionCancellationEmail } from './email-service';

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

        // Enviar email de confirmação
        await sendSubscriptionEmail(
          user.email,
          user.name,
          payment.planType,
          now,
          expiresAt,
          parseFloat(payment.amount)
        );

        // Enviar notificação WhatsApp automática
        await sendPaymentConfirmationWhatsApp(user, payment, pix);

        console.log(`Assinatura ${payment.planType} ativada para usuário ${userId} até ${expiresAt}`);
        
      } catch (error) {
        console.error('Erro ao ativar assinatura:', error);
      }
    }

    // Processar reembolso/restituição
    if (status === 'REFUND' || status === 'REFUNDED') {
      console.log(`Reembolso PIX detectado para usuário ${userId}`);

      // Buscar pagamento na nossa tabela de controle
      const [payment] = await db
        .select()
        .from(openPixPayments)
        .where(eq(openPixPayments.correlationId, correlationID));
      
      if (!payment) {
        console.error('Pagamento não encontrado para reembolso:', correlationID);
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      const now = new Date();

      try {
        // Atualizar status do pagamento para reembolsado
        await db.update(openPixPayments)
          .set({
            status: 'REFUNDED',
            subscriptionActivated: false,
            refundedAt: now,
            webhookData: req.body,
            updatedAt: now
          })
          .where(eq(openPixPayments.id, payment.id));

        // Cancelar assinatura do usuário
        await db.update(users)
          .set({
            subscriptionActive: false,
            subscriptionExpiresAt: now, // Expira imediatamente
            paymentRequired: true
          })
          .where(eq(users.id, userId));

        // Enviar email de cancelamento
        await sendSubscriptionCancellationEmail(
          user.email,
          user.name,
          parseFloat(payment.amount),
          now
        );

        // Enviar notificação WhatsApp de cancelamento
        await sendRefundNotificationWhatsApp(user, payment, pix);

        console.log(`Assinatura cancelada para usuário ${userId} devido ao reembolso`);
        
      } catch (error) {
        console.error('Erro ao processar reembolso:', error);
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

    // Consultar diretamente na API da OpenPix
    const response = await axios.get(
      `${openPixConfig.apiUrl}/charge/${chargeId}`,
      {
        headers: {
          'Authorization': openPixConfig.authorization
        }
      }
    );

    const charge = response.data?.charge;
    
    if (!charge) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }

    console.log(`Status da cobrança ${chargeId}:`, charge.status);

    // Se a cobrança foi paga na OpenPix, verificar se processamos localmente
    if (charge.status === 'COMPLETED' || charge.status === 'PAID') {
      // Verificar se já processamos esta cobrança
      const [localPayment] = await db
        .select()
        .from(openPixPayments)
        .where(eq(openPixPayments.openPixChargeId, chargeId));

      if (localPayment && !localPayment.processed) {
        // Pagamento confirmado na OpenPix mas não processado localmente
        // Buscar usuário para processar
        const [user] = await db.select().from(users).where(eq(users.id, localPayment.userId));
        
        if (user) {
          console.log(`Processando pagamento confirmado na OpenPix para usuário ${user.id}`);
          
          // Ativar assinatura
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + 30);

          await db.update(users).set({
            subscriptionActive: true,
            subscriptionType: 'monthly',
            subscriptionExpiresAt: expiresAt,
            paymentRequired: false
          }).where(eq(users.id, user.id));

          // Marcar pagamento como processado
          await db.update(openPixPayments).set({
            processed: true,
            subscriptionActivated: true,
            status: 'COMPLETED'
          }).where(eq(openPixPayments.id, localPayment.id));

          // Enviar notificação WhatsApp se configurado
          await sendPaymentConfirmationWhatsApp(user, localPayment, { charge });

          console.log(`Assinatura ativada automaticamente para usuário ${user.id}`);
        }
      }
    }

    return res.json({
      success: true,
      charge: {
        identifier: charge.identifier,
        status: charge.status,
        value: charge.value,
        customer: charge.customer,
        correlationID: charge.correlationID,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt,
        paidAt: charge.paidAt
      }
    });

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

/**
 * Buscar cobranças do OpenPix específicas do usuário logado
 */
export async function getUserOpenPixCharges(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!openPixConfig.authorization) {
      return res.status(500).json({ error: 'OpenPix não configurado' });
    }

    // Buscar pagamentos do usuário na nossa tabela de controle
    const userPayments = await db
      .select()
      .from(openPixPayments)
      .where(eq(openPixPayments.userId, req.user.id))
      .orderBy(openPixPayments.createdAt);

    // Se não há pagamentos registrados, retorna lista vazia
    if (userPayments.length === 0) {
      return res.json({
        pageInfo: {
          skip: 0,
          limit: 100,
          totalCount: 0,
          hasPreviousPage: false,
          hasNextPage: false
        },
        charges: []
      });
    }

    // Buscar detalhes das cobranças no OpenPix usando os correlationIds
    const charges = [];
    
    for (const payment of userPayments) {
      try {
        if (payment.openPixChargeId) {
          const response = await axios.get(
            `${openPixConfig.apiUrl}/charge/${payment.openPixChargeId}`,
            {
              headers: {
                'Authorization': openPixConfig.authorization
              }
            }
          );
          
          if (response.data.charge) {
            charges.push(response.data.charge);
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar cobrança ${payment.openPixChargeId}:`, error);
        // Continua para as próximas cobranças
      }
    }

    return res.json({
      pageInfo: {
        skip: 0,
        limit: 100,
        totalCount: charges.length,
        hasPreviousPage: false,
        hasNextPage: false
      },
      charges: charges
    });

  } catch (error: any) {
    console.error('Erro ao buscar cobranças do usuário:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar cobranças do usuário',
      details: error.message
    });
  }
}

/**
 * Buscar estatísticas financeiras em tempo real da OpenPix (Admin)
 */
export async function getOpenPixFinanceStats(req: Request, res: Response) {
  try {
    console.log('=== GET OPENPIX FINANCE STATS ===');
    
    // Buscar todas as cobranças da OpenPix
    const response = await fetch(`${openPixConfig.apiUrl}/charge`, {
      method: 'GET',
      headers: {
        'Authorization': openPixConfig.authorization,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenPix API retornou erro: ${response.status}`);
    }

    const data = await response.json();
    const charges = data.charges || [];

    // Filtrar cobranças pagas (COMPLETED)
    const paidCharges = charges.filter((charge: any) => charge.status === 'COMPLETED');
    
    // Calcular estatísticas
    const totalRevenue = paidCharges.reduce((total: number, charge: any) => {
      return total + (charge.value || 0);
    }, 0);

    // Receita do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = paidCharges
      .filter((charge: any) => {
        const chargeDate = new Date(charge.paidAt || charge.createdAt);
        return chargeDate.getMonth() === currentMonth && chargeDate.getFullYear() === currentYear;
      })
      .reduce((total: number, charge: any) => total + (charge.value || 0), 0);

    // Contar assinaturas ativas (cobranças dos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeSubscriptions = charges.filter((charge: any) => {
      const chargeDate = new Date(charge.createdAt);
      return chargeDate > thirtyDaysAgo && charge.correlationID?.includes('subscription');
    }).length;

    // Dados mensais dos últimos 6 meses
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthRevenue = paidCharges
        .filter((charge: any) => {
          const chargeDate = new Date(charge.paidAt || charge.createdAt);
          return chargeDate.getMonth() === month && chargeDate.getFullYear() === year;
        })
        .reduce((total: number, charge: any) => total + (charge.value || 0), 0);

      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue / 100 // Converter centavos para reais
      });
    }

    // Status das cobranças
    const subscriptionsByStatus = [
      {
        status: 'Ativas',
        count: charges.filter((c: any) => c.status === 'ACTIVE').length
      },
      {
        status: 'Pagas',
        count: charges.filter((c: any) => c.status === 'COMPLETED').length
      },
      {
        status: 'Expiradas',
        count: charges.filter((c: any) => c.status === 'EXPIRED').length
      }
    ];

    const stats = {
      totalRevenue: totalRevenue / 100, // Converter centavos para reais
      monthlyRevenue: monthlyRevenue / 100,
      activeSubscriptions,
      churnRate: 0, // Calcular baseado em dados históricos se necessário
      monthlyData,
      subscriptionsByStatus
    };

    console.log('Estatísticas calculadas:', stats);

    res.json(stats);

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

/**
 * Buscar todas as assinaturas combinando OpenPix + banco local (Admin)
 */
export async function getOpenPixSubscriptions(req: Request, res: Response) {
  try {
    console.log('=== GET COMBINED SUBSCRIPTIONS (OpenPix + Local) ===');
    
    // 1. Buscar assinaturas da OpenPix
    const openPixSubscriptions: any[] = [];
    try {
      const response = await fetch(`${openPixConfig.apiUrl}/charge`, {
        method: 'GET',
        headers: {
          'Authorization': openPixConfig.authorization,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const charges = data.charges || [];

        // Filtrar cobranças relacionadas a assinaturas
        const subscriptionCharges = charges.filter((charge: any) => 
          charge.correlationID?.includes('subscription') || 
          charge.comment?.toLowerCase().includes('assinatura')
        );

        // Mapear para formato esperado
        subscriptionCharges.forEach((charge: any) => {
          const statusMap: any = {
            'COMPLETED': 'active',
            'ACTIVE': 'active', 
            'EXPIRED': 'canceled',
            'CREATED': 'trialing'
          };

          openPixSubscriptions.push({
            id: `openpix-${charge.identifier}`,
            source: 'openpix',
            clientId: null,
            clientName: charge.customer?.name || 'Cliente OpenPix',
            email: charge.customer?.email || '',
            plan: charge.value >= 5000 ? 'annual' : 'monthly',
            status: statusMap[charge.status] || 'trialing',
            amount: charge.value / 100,
            startDate: charge.createdAt,
            endDate: charge.expiresDate || null
          });
        });
      }
    } catch (openPixError) {
      console.warn('Erro ao buscar dados da OpenPix:', openPixError);
    }

    // 2. Buscar assinaturas do banco local
    const localSubscriptions: any[] = [];
    try {
      const subscriptionsQuery = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          clientId: subscriptions.clientId,
          planType: subscriptions.planType,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          userName: users.name,
          userEmail: users.email
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(eq(subscriptions.status, 'active'));

      subscriptionsQuery.forEach((sub) => {
        localSubscriptions.push({
          id: `local-${sub.id}`,
          source: 'local',
          clientId: sub.clientId,
          clientName: sub.userName || 'Cliente Local',
          email: sub.userEmail || '',
          plan: sub.planType || 'monthly',
          status: sub.status,
          amount: sub.planType === 'annual' ? 498.0 : 49.9, // Valores padrão
          startDate: sub.currentPeriodStart,
          endDate: sub.currentPeriodEnd
        });
      });
    } catch (localError) {
      console.warn('Erro ao buscar dados locais:', localError);
    }

    // 3. Combinar as duas fontes
    const allSubscriptions = [
      ...openPixSubscriptions,
      ...localSubscriptions
    ];

    console.log(`Assinaturas combinadas: ${openPixSubscriptions.length} OpenPix + ${localSubscriptions.length} Local = ${allSubscriptions.length} Total`);

    res.json(allSubscriptions);

  } catch (error: any) {
    console.error('Erro ao buscar assinaturas combinadas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

/**
 * Buscar todas as faturas da OpenPix (Admin)
 */
export async function getOpenPixInvoices(req: Request, res: Response) {
  try {
    console.log('=== GET OPENPIX INVOICES ===');
    
    // Buscar todas as cobranças da OpenPix
    const response = await fetch(`${openPixConfig.apiUrl}/charge`, {
      method: 'GET',
      headers: {
        'Authorization': openPixConfig.authorization,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenPix API retornou erro: ${response.status}`);
    }

    const data = await response.json();
    const charges = data.charges || [];

    // Mapear cobranças para formato de faturas
    const invoices = charges.map((charge: any) => {
      const statusMap: any = {
        'COMPLETED': 'paid',
        'ACTIVE': 'open',
        'EXPIRED': 'void',
        'CREATED': 'open'
      };

      return {
        id: charge.identifier,
        clientName: charge.customer?.name || 'Cliente não identificado',
        email: charge.customer?.email || '',
        amount: charge.value / 100, // Converter centavos para reais
        status: statusMap[charge.status] || 'open',
        date: charge.paidAt || charge.createdAt
      };
    });

    console.log('Faturas mapeadas:', invoices.length);

    res.json(invoices);

  } catch (error: any) {
    console.error('Erro ao buscar faturas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

/**
 * Envia notificação WhatsApp automática quando um pagamento é confirmado
 */
async function sendPaymentConfirmationWhatsApp(user: any, payment: any, pixData: any) {
  try {
    console.log('=== ENVIANDO NOTIFICAÇÃO WHATSAPP AUTOMÁTICA ===');
    console.log(`Usuário: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Valor: R$ ${parseFloat(payment.amount).toFixed(2)}`);

    // Buscar configuração de webhook para WhatsApp
    const webhookConfig = await getOpenPixWebhookConfig();
    
    if (!webhookConfig.enabled || !webhookConfig.whatsappWebhookUrl) {
      console.log('Webhook WhatsApp não configurado ou desabilitado');
      return false;
    }

    // Preparar dados da mensagem
    const messageData = {
      event: 'payment_confirmed',
      timestamp: new Date().toISOString(),
      customer: {
        name: user.name,
        email: user.email,
        id: user.id
      },
      payment: {
        amount: parseFloat(payment.amount),
        correlationId: payment.correlationId,
        planType: payment.planType,
        paidAt: pixData.time || new Date().toISOString()
      },
      pix: {
        txid: pixData.txid,
        endToEndId: pixData.endToEndId,
        value: pixData.value / 100 // Converter de centavos
      },
      message: `🎉 *PAGAMENTO CONFIRMADO* 🎉

✅ Cliente: ${user.name}
📧 Email: ${user.email}
💰 Valor: R$ ${parseFloat(payment.amount).toFixed(2)}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}
🔑 ID: ${payment.correlationId}

Assinatura QUERO FRETES ativada com sucesso!
Vigência: 30 dias a partir de hoje.

*Sistema automatizado QUERO FRETES*`
    };

    // Enviar para webhook WhatsApp configurado
    const response = await fetch(webhookConfig.whatsappWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QueroFretes-OpenPix-Webhook/1.0'
      },
      body: JSON.stringify(messageData)
    });

    if (response.ok) {
      console.log('Notificação WhatsApp enviada com sucesso');
      return true;
    } else {
      console.error('Erro ao enviar notificação WhatsApp:', response.status, response.statusText);
      return false;
    }

  } catch (error) {
    console.error('Erro ao enviar notificação WhatsApp:', error);
    return false;
  }
}

/**
 * Configuração do webhook OpenPix para WhatsApp
 */
interface OpenPixWebhookConfig {
  enabled: boolean;
  whatsappWebhookUrl: string;
  notifyPayments: boolean;
  notifySubscriptions: boolean;
}

// Configuração padrão (será persistida no banco posteriormente)
let openPixWebhookConfig: OpenPixWebhookConfig = {
  enabled: false,
  whatsappWebhookUrl: '',
  notifyPayments: true,
  notifySubscriptions: true
};

/**
 * Obter configuração do webhook OpenPix
 */
async function getOpenPixWebhookConfig(): Promise<OpenPixWebhookConfig> {
  return openPixWebhookConfig;
}

/**
 * Definir configuração do webhook OpenPix
 */
export async function setOpenPixWebhookConfig(config: Partial<OpenPixWebhookConfig>): Promise<void> {
  openPixWebhookConfig = { ...openPixWebhookConfig, ...config };
  console.log('Configuração do webhook OpenPix atualizada:', openPixWebhookConfig);
}

/**
 * Obter configuração atual do webhook OpenPix (endpoint público)
 */
export async function getOpenPixWebhookConfigAPI(req: Request, res: Response) {
  try {
    const config = await getOpenPixWebhookConfig();
    res.json(config);
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Atualizar configuração do webhook OpenPix (endpoint público)
 */
export async function updateOpenPixWebhookConfigAPI(req: Request, res: Response) {
  try {
    const newConfig = req.body;
    await setOpenPixWebhookConfig(newConfig);
    
    const updatedConfig = await getOpenPixWebhookConfig();
    res.json({ 
      success: true, 
      message: 'Configuração atualizada com sucesso',
      config: updatedConfig 
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
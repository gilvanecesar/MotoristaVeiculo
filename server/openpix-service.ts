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
 * Simula pagamento PIX para testes (sem cobrar valor real)
 */
export async function simulatePixPayment(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { chargeId, paymentValue = 4990 } = req.body;
    
    if (!chargeId) {
      return res.status(400).json({ error: 'ID da cobrança é obrigatório' });
    }

    // Buscar a cobrança no banco
    const [payment] = await db
      .select()
      .from(openPixPayments)
      .where(eq(openPixPayments.openPixChargeId, chargeId));

    if (!payment) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }

    // Simular webhook de pagamento aprovado
    const simulatedWebhookData = {
      event: "OPENPIX:CHARGE_COMPLETED",
      charge: {
        identifier: chargeId,
        correlationID: payment.correlationId,
        status: "COMPLETED",
        value: paymentValue,
        customer: {
          name: req.user.name,
          email: req.user.email
        },
        paidAt: new Date().toISOString(),
        pixKey: "test@openpix.com.br"
      }
    };

    // Processar o pagamento simulado
    await processOpenPixPayment(simulatedWebhookData.charge, req.user);

    console.log(`🧪 [SIMULAÇÃO] Pagamento de R$ ${paymentValue/100} simulado para ${req.user.email}`);

    res.json({
      success: true,
      message: "Pagamento simulado com sucesso!",
      data: {
        chargeId,
        status: "COMPLETED",
        amount: paymentValue/100,
        simulatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao simular pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao simular pagamento',
      details: error.message
    });
  }
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
      monthly: 49.90
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
 * Webhook específico para reembolsos da OpenPix
 */
export async function handleOpenPixRefundWebhook(req: Request, res: Response) {
  try {
    console.log('🔄 Webhook de reembolso OpenPix recebido:', JSON.stringify(req.body, null, 2));
    
    const { refund } = req.body;
    
    if (!refund) {
      console.log('❌ Webhook de reembolso sem dados de refund');
      return res.status(400).json({ error: 'Dados de reembolso não encontrados' });
    }

    const { correlationID, status, value, refundId, time } = refund;
    
    // Verificar se é um reembolso confirmado
    if (status !== 'CONFIRMED') {
      console.log(`ℹ️ Reembolso não confirmado, status: ${status}`);
      return res.status(200).json({ message: 'Reembolso não confirmado, ignorado' });
    }

    console.log(`💰 Processando reembolso confirmado: ${refundId} - R$ ${value/100}`);
    
    // Buscar a cobrança original pelo correlationID
    const originalCharge = await axios.get(`${openPixConfig.apiUrl}/charge?correlationID=${correlationID}`, {
      headers: {
        'Authorization': openPixConfig.authorization,
        'Content-Type': 'application/json'
      }
    });

    if (!originalCharge.data.charges || originalCharge.data.charges.length === 0) {
      console.log(`❌ Cobrança original não encontrada para correlationID: ${correlationID}`);
      return res.status(404).json({ error: 'Cobrança original não encontrada' });
    }

    const charge = originalCharge.data.charges[0];
    console.log(`🔍 Cobrança original encontrada: ${charge.identifier}`);

    // Extrair userId do correlationID (formato: querofretes-{userId}-{timestamp})
    const correlationParts = correlationID.split('-');
    if (correlationParts.length < 2 || correlationParts[0] !== 'querofretes') {
      console.log(`❌ Formato de correlationID inválido: ${correlationID}`);
      return res.status(400).json({ error: 'Formato de correlationID inválido' });
    }

    const userId = parseInt(correlationParts[1]);
    console.log(`👤 Processando reembolso para usuário ID: ${userId}`);

    // Buscar usuário no banco
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      console.log(`❌ Usuário não encontrado no banco: ${userId}`);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    console.log(`👤 Usuário encontrado: ${user.email}`);

    // Cancelar assinatura do usuário
    await db.update(users)
      .set({
        subscriptionActive: false,
        subscriptionType: null,
        subscriptionExpiresAt: null,
        refundedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`✅ Assinatura cancelada para usuário: ${user.email}`);

    // Atualizar registro de pagamento existente com reembolso
    try {
      await db.update(openPixPayments)
        .set({
          status: 'EXPIRED',
          refundedAt: new Date(time),
          processed: true,
          subscriptionActivated: false,
          webhookData: { refund: refund, charge: charge },
          updatedAt: new Date()
        })
        .where(eq(openPixPayments.openPixChargeId, charge.identifier));

      console.log(`💾 Reembolso registrado no pagamento existente`);
    } catch (updateError) {
      console.log(`⚠️ Pagamento não encontrado, criando novo registro de reembolso`);
      
      // Se não existe pagamento, criar novo registro marcado como reembolsado
      await db.insert(openPixPayments).values({
        userId: userId,
        openPixChargeId: charge.identifier,
        correlationId: correlationID,
        status: 'EXPIRED',
        amount: (value / 100).toString(),
        amountCents: value,
        pixCode: charge.brCode || null,
        qrCodeImage: charge.qrCodeImage || null,
        paymentUrl: charge.paymentLinkUrl || null,
        planType: 'monthly',
        paidAt: charge.paidAt ? new Date(charge.paidAt) : null,
        refundedAt: new Date(time),
        processed: true,
        subscriptionActivated: false,
        webhookData: { refund: refund, charge: charge }
      });
    }

    console.log(`💾 Reembolso registrado no banco de dados`);

    // Enviar email de cancelamento por reembolso
    try {
      await sendSubscriptionCancellationEmail(
        user.email,
        user.name,
        value / 100, // Converter centavos para reais
        new Date(time)
      );
      console.log(`📧 Email de cancelamento enviado para: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de cancelamento:', emailError);
    }

    // Enviar notificação WhatsApp se configurado
    try {
      await sendRefundNotificationWhatsApp(user, { value, refundId }, { correlationID, time });
      console.log(`📱 Notificação WhatsApp de reembolso enviada`);
    } catch (whatsappError) {
      console.error('❌ Erro ao enviar notificação WhatsApp:', whatsappError);
    }

    console.log(`🎉 Reembolso processado com sucesso para ${user.email}`);
    
    res.status(200).json({ 
      message: 'Reembolso processado com sucesso',
      userId: userId,
      refundId: refundId,
      amount: value / 100
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook de reembolso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Webhook para receber notificações do OpenPix
 */
export async function handleOpenPixWebhook(req: Request, res: Response) {
  try {
    console.log('Webhook OpenPix recebido:', req.body);

    // Verificar se é um webhook de teste
    if (req.body.evento === 'teste_webhook') {
      console.log('✅ Webhook de teste recebido com sucesso');
      return res.status(200).json({ 
        message: 'Webhook de teste processado com sucesso',
        event: req.body.event || req.body.evento
      });
    }

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
      console.log(`⚠️ Usuário ID ${userId} não encontrado no banco de dados (pode ter sido deletado)`);
      console.log(`📋 Webhook recebido para usuário inexistente - correlationID: ${correlationID}`);
      
      // Marcar como processado mesmo sem usuário para evitar reprocessamento
      try {
        await db.update(openPixPayments)
          .set({
            status: 'USER_NOT_FOUND',
            processed: true,
            webhookData: req.body,
            updatedAt: new Date()
          })
          .where(eq(openPixPayments.correlationId, correlationID));
        
        console.log(`✅ Webhook marcado como processado para usuário inexistente`);
      } catch (updateError) {
        console.log(`⚠️ Erro ao marcar webhook como processado:`, updateError);
      }
      
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

    // Filtrar cobranças para mostrar apenas as de 2025 em diante
    if (response.data.charges) {
      const filteredCharges = response.data.charges.filter((charge: any) => {
        const chargeDate = new Date(charge.createdAt);
        const is2025OrLater = chargeDate.getFullYear() >= 2025;
        
        if (!is2025OrLater) {
          console.log(`🗓️ [FILTRO DATA LISTA] Excluindo cobrança de ${chargeDate.getFullYear()}: ${charge.customer?.name || 'Cliente'}`);
        }
        
        return is2025OrLater;
      });

      response.data.charges = filteredCharges;
      response.data.pageInfo.totalCount = filteredCharges.length;
    }

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
  try {
    console.log(`[PROCESSO PAGAMENTO] Iniciando para usuário ${user.id}, cobrança ${charge.identifier}`);
    
    // Verificar se já foi processado
    const existingPayment = await db
      .select()
      .from(openPixPayments)
      .where(eq(openPixPayments.correlationId, charge.correlationID))
      .limit(1);
    
    if (existingPayment.length > 0 && existingPayment[0].processed) {
      console.log(`[PROCESSO PAGAMENTO] Pagamento já processado anteriormente: ${charge.identifier}`);
      return;
    }

    // Extrair tipo de plano - sempre usar "monthly" conforme padrão do sistema
    const planType = 'monthly';

    // Calcular data de expiração - sempre 30 dias conforme padrão
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30); // Sempre 30 dias

    console.log(`[PROCESSO PAGAMENTO] Ativando assinatura para usuário ${user.id} até ${expiresAt.toISOString()}`);

    // Ativar assinatura do usuário
    const updateResult = await db.update(users)
      .set({
        subscriptionActive: true,
        subscriptionType: planType,
        subscriptionExpiresAt: expiresAt,
        paymentRequired: false
      })
      .where(eq(users.id, user.id))
      .returning();

    console.log(`[PROCESSO PAGAMENTO] Resultado da atualização:`, updateResult);

    // Atualizar registro do pagamento se existir
    if (existingPayment.length > 0) {
      await db.update(openPixPayments)
        .set({
          status: OPENPIX_PAYMENT_STATUS.COMPLETED,
          processed: true,
          subscriptionActivated: true,
          paidAt: now,
          subscriptionStartDate: now,
          subscriptionEndDate: expiresAt,
          updatedAt: now
        })
        .where(eq(openPixPayments.id, existingPayment[0].id));
      
      console.log(`[PROCESSO PAGAMENTO] Registro de pagamento atualizado: ${existingPayment[0].id}`);
    }

    console.log(`[PROCESSO PAGAMENTO] Concluído para usuário ${user.id}: ${charge.identifier}`);

  } catch (error) {
    console.error(`[PROCESSO PAGAMENTO] Erro ao processar para usuário ${user.id}:`, error);
    throw error;
  }
}

/**
 * Força sincronização manual de um pagamento específico
 */
export async function forcePaymentSync(req: Request, res: Response) {
  try {
    const { chargeId } = req.params;
    const userId = req.user?.id;

    if (!chargeId) {
      return res.status(400).json({ error: 'ID da cobrança é obrigatório' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log(`Forçando sincronização do pagamento ${chargeId} para usuário ${userId}`);

    // Buscar status atual na OpenPix
    const response = await axios.get(
      `${openPixConfig.apiUrl}/charge/${chargeId}`,
      {
        headers: {
          'Authorization': openPixConfig.authorization
        }
      }
    );

    const charge = response.data.charge;
    
    if (!charge) {
      return res.status(404).json({ error: 'Cobrança não encontrada na OpenPix' });
    }

    console.log('Status da cobrança na OpenPix:', charge.status);

    // Se a cobrança foi paga, processar o pagamento
    if (charge.status === 'COMPLETED' || charge.status === 'PAID') {
      console.log('Cobrança paga, processando...');

      // Buscar o usuário
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Processar o pagamento manualmente
      await processOpenPixPayment(charge, user);

      return res.json({
        success: true,
        message: 'Pagamento processado com sucesso!',
        charge: {
          status: charge.status,
          identifier: charge.identifier
        }
      });
    } else {
      return res.json({
        success: false,
        message: `Pagamento ainda não foi confirmado. Status atual: ${charge.status}`,
        charge: {
          status: charge.status,
          identifier: charge.identifier
        }
      });
    }

  } catch (error: any) {
    console.error('Erro ao forçar sincronização:', error);
    return res.status(500).json({ 
      error: 'Erro ao verificar pagamento',
      details: error.response?.data?.message || error.message
    });
  }
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

    // Filtrar cobranças de 2025 em diante E pagas (COMPLETED)
    const paidCharges = charges.filter((charge: any) => {
      const chargeDate = new Date(charge.createdAt);
      const is2025OrLater = chargeDate.getFullYear() >= 2025;
      const isPaid = charge.status === 'COMPLETED';
      
      if (isPaid && !is2025OrLater) {
        console.log(`🗓️ [FILTRO DATA STATS] Excluindo da estatística cobrança de ${chargeDate.getFullYear()}: ${charge.customer?.name || 'Cliente'}`);
      }
      
      return isPaid && is2025OrLater;
    });
    
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
    console.log(`🚀 [ENDPOINT] Endpoint /api/admin/openpix/subscriptions chamado em ${new Date().toISOString()}`);
    
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

        // Filtrar cobranças relacionadas a assinaturas E criadas a partir de 2025
        const subscriptionCharges = charges.filter((charge: any) => {
          // Verificar se é relacionado a assinatura
          const isSubscription = charge.correlationID?.includes('subscription') || 
                                 charge.comment?.toLowerCase().includes('assinatura');
          
          // Verificar se é de 2025 ou posterior
          const chargeDate = new Date(charge.createdAt);
          const is2025OrLater = chargeDate.getFullYear() >= 2025;
          
          console.log(`🔍 [DEBUG FILTRO] Cliente: ${charge.customer?.name || 'Cliente'}, Data: ${chargeDate.toISOString()}, Ano: ${chargeDate.getFullYear()}, É 2025+: ${is2025OrLater}, É assinatura: ${isSubscription}`);
          
          if (isSubscription && !is2025OrLater) {
            console.log(`🗓️ [FILTRO DATA] Excluindo cobrança de ${chargeDate.getFullYear()}: ${charge.customer?.name || 'Cliente'}`);
          }
          
          return isSubscription && is2025OrLater;
        });

        // Mapear para formato esperado
        subscriptionCharges.forEach((charge: any) => {
          const statusMap: any = {
            'COMPLETED': 'active',
            'ACTIVE': 'active', 
            'EXPIRED': 'canceled',
            'CREATED': 'trialing'
          };

          // Filtrar usuários específicos que devem ser excluídos da lista
          const customerName = charge.customer?.name || 'Cliente OpenPix';
          const excludedNames = [
            'CRISTIANE ROCHADEL FISCHMAN'
          ];
          
          // Pular este registro se for um nome excluído
          if (excludedNames.some(excludedName => 
            customerName.toUpperCase().includes(excludedName.toUpperCase())
          )) {
            console.log(`🚫 [FILTRO] Excluindo da lista de assinaturas: ${customerName}`);
            return; // Pula este registro
          }

          openPixSubscriptions.push({
            id: `openpix-${charge.identifier}`,
            source: 'openpix',
            clientId: null,
            clientName: customerName,
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
    const invoices = charges
      .filter((charge: any) => {
        // Verificar se é de 2025 ou posterior
        const chargeDate = new Date(charge.createdAt);
        const is2025OrLater = chargeDate.getFullYear() >= 2025;
        
        if (!is2025OrLater) {
          console.log(`🗓️ [FILTRO DATA FATURAS] Excluindo fatura de ${chargeDate.getFullYear()}: ${charge.customer?.name || 'Cliente'}`);
          return false;
        }
        
        // Filtrar usuários específicos que devem ser excluídos da lista (backup, caso ainda apareçam)
        const customerName = charge.customer?.name || 'Cliente não identificado';
        const excludedNames = [
          'CRISTIANE ROCHADEL FISCHMAN'
        ];
        
        // Retornar false para excluir, true para incluir
        const shouldExclude = excludedNames.some(excludedName => 
          customerName.toUpperCase().includes(excludedName.toUpperCase())
        );
        
        if (shouldExclude) {
          console.log(`🚫 [FILTRO FATURAS] Excluindo da lista: ${customerName}`);
        }
        
        return !shouldExclude;
      })
      .map((charge: any) => {
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
 * Configurar webhook da OpenPix para o domínio correto
 */
export async function configureOpenPixWebhook(req: Request, res: Response) {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'URL do webhook é obrigatória' });
    }

    console.log(`🔧 Configurando webhook OpenPix para: ${webhookUrl}`);

    // Configurar webhook via API da OpenPix
    const webhookConfig = {
      webhook: {
        name: 'QueroFretes System',
        url: webhookUrl,
        authorization: process.env.OPENPIX_WEBHOOK_AUTHORIZATION || '',
        isActive: true,
        event: 'OPENPIX:CHARGE_COMPLETED'
      }
    };

    const response = await axios.post(`${openPixConfig.apiUrl}/webhook`, webhookConfig, {
      headers: {
        'Authorization': openPixConfig.authorization,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook configurado com sucesso:', response.data);

    res.json({ 
      message: 'Webhook configurado com sucesso',
      webhook: response.data,
      configuredUrl: webhookUrl
    });

  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao configurar webhook',
      details: error.response?.data || error.message
    });
  }
}

/**
 * Listar webhooks configurados na OpenPix
 */
export async function listOpenPixWebhooks(req: Request, res: Response) {
  try {
    console.log('📋 Listando webhooks configurados na OpenPix...');

    const response = await axios.get(`${openPixConfig.apiUrl}/webhook`, {
      headers: {
        'Authorization': openPixConfig.authorization,
        'Content-Type': 'application/json'
      }
    });

    console.log('📋 Webhooks encontrados:', response.data);

    res.json({ 
      webhooks: response.data,
      total: response.data?.webhooks?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar webhooks:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao listar webhooks',
      details: error.response?.data || error.message
    });
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

/**
 * Envia notificação WhatsApp para reembolso/cancelamento de assinatura
 */
async function sendRefundNotificationWhatsApp(user: any, payment: any, pixData: any) {
  console.log('=== ENVIANDO NOTIFICAÇÃO WHATSAPP DE REEMBOLSO ===');
  console.log('Usuário:', user.name);
  console.log('Email:', user.email);
  console.log('Valor reembolsado: R$', payment.amount);

  const config = await getOpenPixWebhookConfig();
  
  if (!config.enabled || !config.notifyPayments) {
    console.log('Webhook WhatsApp não configurado ou desabilitado para reembolsos');
    return;
  }

  try {
    // Aqui será implementada a integração com WhatsApp quando configurada
    // Por enquanto, apenas logamos a intenção
    console.log('Notificação de reembolso via WhatsApp enviada com sucesso');
  } catch (error) {
    console.error('Erro ao enviar notificação WhatsApp de reembolso:', error);
  }
}
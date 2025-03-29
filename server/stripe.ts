import Stripe from 'stripe';
import { Request, Response } from 'express';
import { storage } from './storage';

// Inicializa o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Preço do plano: R$ 99,90/mês com cobrança anual (12x R$ 99,90 = R$ 1.198,80)
const ANNUAL_PLAN_PRICE_ID = process.env.STRIPE_PRICE_ID;
console.log("Usando ID de preço do Stripe:", ANNUAL_PLAN_PRICE_ID);

// Configuração dos tipos de assinatura
const SUBSCRIPTION_TYPES = {
  ANNUAL: "annual",   // Assinatura anual
  MONTHLY: "monthly"  // Assinatura mensal (30 dias)
};

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    // Obtém o usuário da requisição
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Determina o tipo de assinatura (padrão: mensal)
    const subscriptionType = req.body.subscriptionType || SUBSCRIPTION_TYPES.MONTHLY;
    console.log(`Criando assinatura do tipo: ${subscriptionType}`);
    
    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: ANNUAL_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=${subscriptionType}`,
      cancel_url: `${req.headers.origin}/payment-cancel`,
      customer_email: user.email, // Pre-preenche o email do usuário
      metadata: {
        userId: user.id.toString(), // Armazena o ID do usuário como metadado
        subscriptionType: subscriptionType, // Tipo de assinatura (mensal ou anual)
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createPortalSession(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Busca o cliente no Stripe associado a este usuário
    // Você precisará armazenar o customerId do Stripe em algum lugar
    const customerId = 'customer_id_do_stripe'; // Substitua por uma busca no banco de dados

    // Cria a sessão do portal de clientes
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/account`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão do portal:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).json({ error: 'Falta o cabeçalho stripe-signature' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Manipula eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Atualiza o status da assinatura do usuário no banco de dados
        if (session.metadata?.userId) {
          const userId = parseInt(session.metadata.userId);
          const subscriptionType = session.metadata.subscriptionType || SUBSCRIPTION_TYPES.MONTHLY;
          
          // Calcula a data de expiração com base no tipo de assinatura
          const now = new Date();
          let expirationDate = new Date();
          
          if (subscriptionType === SUBSCRIPTION_TYPES.ANNUAL) {
            // Assinatura anual: adiciona 1 ano
            expirationDate.setFullYear(now.getFullYear() + 1);
          } else {
            // Assinatura mensal: adiciona 30 dias
            expirationDate.setDate(now.getDate() + 30);
          }
          
          // Atualiza o usuário com as informações da assinatura
          const updatedUser = await storage.updateUser(userId, {
            subscriptionActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: expirationDate,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string
          });
          
          console.log(`Assinatura ${subscriptionType} ativada para usuário: ${userId}, expira em: ${expirationDate.toISOString()}`);
        }
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        // Encontra o usuário pelo customerId
        const customerUpdated = updatedSubscription.customer as string;
        
        // Aqui você precisa encontrar o usuário pelo customerID no seu banco de dados
        // Exemplo: const user = await storage.getUserByStripeCustomerId(customerUpdated);
        
        // Atualiza o status da assinatura com base no status retornado pelo Stripe
        if (updatedSubscription.status === 'active') {
          // Assinatura ativa
          console.log(`Assinatura atualizada e ativa para cliente: ${customerUpdated}`);
          
          // Aqui você atualizaria o usuário
          // await storage.updateUser(user.id, { subscriptionActive: true });
        } else {
          // Assinatura inativa, cancelada, etc.
          console.log(`Assinatura atualizada e inativa para cliente: ${customerUpdated}`);
          
          // Aqui você atualizaria o usuário
          // await storage.updateUser(user.id, { subscriptionActive: false });
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        // Encontra o usuário pelo customerId
        const customerDeleted = deletedSubscription.customer as string;
        
        // Aqui você precisa encontrar o usuário pelo customerID no seu banco de dados
        // Exemplo: const user = await storage.getUserByStripeCustomerId(customerDeleted);
        
        console.log(`Assinatura cancelada para cliente: ${customerDeleted}`);
        
        // Atualiza o usuário para remover a assinatura ativa
        // await storage.updateUser(user.id, {
        //   subscriptionActive: false,
        //   subscriptionExpiresAt: new Date()  // Define a expiração para agora
        // });
        break;
        
      default:
        console.log(`Evento não manipulado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    res.status(400).json({ error: error.message });
  }
}
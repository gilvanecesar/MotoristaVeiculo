import Stripe from 'stripe';
import { Request, Response } from 'express';

// Inicializa o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

// Preço do plano: R$ 99,90/mês com cobrança anual (12x R$ 99,90 = R$ 1.198,80)
const ANNUAL_PLAN_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_12345678'; // Deve ser configurado nas variáveis de ambiente

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    // Obtém o usuário da requisição
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

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
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-cancel`,
      customer_email: user.email, // Pre-preenche o email do usuário
      metadata: {
        userId: user.id.toString(), // Armazena o ID do usuário como metadado
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
          // Implementar lógica para atualizar o usuário com status 'ativo'
          console.log(`Assinatura ativada para usuário: ${session.metadata.userId}`);
        }
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Implemente a lógica para atualizar o status da assinatura no banco de dados
        console.log(`Status da assinatura atualizado: ${subscription.status}`);
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
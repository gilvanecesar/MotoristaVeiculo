import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { User } from '@shared/schema';

// Configuração do serviço de email
let transporter: nodemailer.Transporter;
let etherealInfo: {
  user: string;
  pass: string;
  web: string;
} | null = null;

// Função auxiliar para criar conta de teste Ethereal
async function createEtherealAccount(): Promise<boolean> {
  try {
    console.log('Criando conta de teste Ethereal para email...');
    const testAccount = await nodemailer.createTestAccount();
    
    // Criar transportador Ethereal para testes
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    etherealInfo = {
      user: testAccount.user,
      pass: testAccount.pass,
      web: testAccount.web
    };
    
    console.log('Conta Ethereal criada para testes de email:');
    console.log(`- Email: ${testAccount.user}`);
    console.log(`- Interface web: ${testAccount.web}`);
    console.log('Use esta interface para visualizar os emails enviados durante o desenvolvimento');
    
    return true;
  } catch (err) {
    console.error('Erro ao criar conta Ethereal:', err);
    return false;
  }
}

// Função para inicializar o serviço de email
export async function initEmailService() {
  console.log('Inicializando serviço de email...');
  
  // Tentar configurar com as credenciais reais primeiro
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_SERVICE) {
    try {
      console.log(`Configurando email com serviço: ${process.env.EMAIL_SERVICE}`);
      
      // Configuração para diferentes provedores
      let emailConfig: any = {
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };

      // Configurações específicas por provedor
      switch (process.env.EMAIL_SERVICE.toLowerCase()) {
        case 'gmail':
        case 'smtp.gmail.com':
          emailConfig.service = 'gmail';
          emailConfig.host = 'smtp.gmail.com';
          emailConfig.port = 587;
          emailConfig.secure = false; // Use STARTTLS
          break;
        case 'outlook':
        case 'hotmail':
        case 'smtp-mail.outlook.com':
          emailConfig.service = 'hotmail';
          emailConfig.host = 'smtp-mail.outlook.com';
          emailConfig.port = 587;
          emailConfig.secure = false; // Use STARTTLS
          break;
        case 'yahoo':
        case 'smtp.mail.yahoo.com':
          emailConfig.service = 'yahoo';
          emailConfig.host = 'smtp.mail.yahoo.com';
          emailConfig.port = 587;
          emailConfig.secure = false; // Use STARTTLS
          break;
        case 'sendgrid':
        case 'smtp.sendgrid.net':
          emailConfig.host = 'smtp.sendgrid.net';
          emailConfig.port = 587;
          emailConfig.secure = false;
          break;
        case 'hostinger':
        case 'smtp.hostinger.com':
          emailConfig.host = 'smtp.hostinger.com';
          emailConfig.port = 587;
          emailConfig.secure = false;
          break;
        default:
          // Configuração SMTP genérica
          emailConfig.host = process.env.EMAIL_HOST || process.env.EMAIL_SERVICE || 'smtp.gmail.com';
          emailConfig.port = parseInt(process.env.EMAIL_PORT || '587');
          emailConfig.secure = process.env.EMAIL_SECURE === 'true';
          break;
      }

      // Aplicar configurações avançadas se disponíveis
      if (process.env.EMAIL_REQUIRE_TLS === 'true') {
        emailConfig.requireTLS = true;
      }
      if (process.env.EMAIL_CONNECTION_TIMEOUT) {
        emailConfig.connectionTimeout = parseInt(process.env.EMAIL_CONNECTION_TIMEOUT);
      }
      if (process.env.EMAIL_GREETING_TIMEOUT) {
        emailConfig.greetingTimeout = parseInt(process.env.EMAIL_GREETING_TIMEOUT);
      }
      if (process.env.EMAIL_SOCKET_TIMEOUT) {
        emailConfig.socketTimeout = parseInt(process.env.EMAIL_SOCKET_TIMEOUT);
      }

      // Configuração SMTP carregada (dados sensíveis omitidos)
      
      transporter = nodemailer.createTransport(emailConfig);
      
      // Verificar conexão
      await transporter.verify();
      console.log('✓ Serviço de email configurado e verificado com sucesso');
      return;
      
    } catch (error) {
      console.error('Erro ao configurar serviço de email principal:', error);
      console.log('Usando conta Ethereal como alternativa...');
    }
  } else {
    console.log('Credenciais de email não configuradas completamente');
  }

  // Usar Ethereal como alternativa
  const etherealSuccess = await createEtherealAccount();
  if (!etherealSuccess) {
    console.error('Falha ao configurar qualquer serviço de email');
  }
}

/**
 * Envia um email de boas-vindas para o usuário recém-registrado
 * @param user Objeto do usuário
 */
export async function sendWelcomeEmail(user: User) {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de boas-vindas não enviado.');
    return;
  }

  if (!user.email) {
    console.warn('Usuário sem email. Email de boas-vindas não enviado.');
    return;
  }

  try {
    const isTrial = user.subscriptionType === 'trial';
    const isShipper = user.profileType === 'embarcador';
    
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Bem-vindo ao QUERO FRETES!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://seusite.com.br/logo.png" alt="QUERO FRETES" style="max-width: 200px;">
          </div>
          <h2 style="color: #4a6cf7;">Olá, ${user.name}!</h2>
          <p>Bem-vindo ao QUERO FRETES - seu sistema de gestão de fretes!</p>
          <p>Seu cadastro foi realizado com sucesso. Abaixo estão seus dados de acesso:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Tipo de Perfil:</strong> ${user.profileType}</p>
            <p><strong>Data de Cadastro:</strong> ${new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          ${isTrial && isShipper ? `
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #1976d2; margin-top: 0;">🎉 Período de Teste Grátis Ativado!</h3>
            <p>Você ganhou <strong>7 dias de acesso gratuito</strong> a todas as funcionalidades do sistema!</p>
            <p><strong>Válido até:</strong> ${user.trialEndDate ? new Date(user.trialEndDate).toLocaleDateString('pt-BR') : '7 dias'}</p>
            <p style="margin-bottom: 0;">Explore todas as ferramentas e veja como podemos ajudar na gestão dos seus fretes!</p>
          </div>
          ` : ''}
          <p>Para aproveitar ao máximo nosso sistema:</p>
          <ol>
            <li>Complete seu cadastro de cliente na aba "Clientes"</li>
            <li>Explore as funcionalidades disponíveis para seu tipo de perfil</li>
            ${isTrial && isShipper ? '<li>Aproveite o período de teste para conhecer todas as funcionalidades</li>' : ''}
            <li>Contate o suporte caso tenha dúvidas</li>
          </ol>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'https://querofretes.com.br'}" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar o Sistema</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de boas-vindas enviado para ${user.email}`);
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
  }
}

/**
 * Envia um email de confirmação de assinatura
 * @param email Email do destinatário
 * @param clientName Nome do cliente
 * @param planType Tipo de plano (mensal, anual, teste)
 * @param startDate Data de início da assinatura
 * @param endDate Data de término da assinatura
 * @param amount Valor da assinatura
 */
export async function sendSubscriptionEmail(
  email: string,
  clientName: string,
  planType: string,
  startDate: Date,
  endDate: Date,
  amount: number
) {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de assinatura não enviado.');
    return;
  }

  // Formatação de valores
  const formattedStartDate = new Date(startDate).toLocaleDateString('pt-BR');
  const formattedEndDate = new Date(endDate).toLocaleDateString('pt-BR');
  const formattedAmount = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(amount);

  // Mapear tipo de plano para texto amigável
  const planTypeMap: Record<string, string> = {
    'monthly': 'Mensal',
    'annual': 'Anual',
    'trial': 'Período de Teste (7 dias)',
    'trialing': 'Aguardando Pagamento'
  };

  const planName = planTypeMap[planType] || planType;
  const isTrial = planType === 'trial';

  try {
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isTrial ? 'Seu período de teste começou!' : 'Confirmação de Assinatura - QUERO FRETES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://seusite.com.br/logo.png" alt="QUERO FRETES" style="max-width: 200px;">
          </div>
          <h2 style="color: #4a6cf7;">${isTrial ? 'Seu período de teste começou!' : 'Confirmação de Assinatura'}</h2>
          <p>Olá, <strong>${clientName}</strong>!</p>
          <p>${isTrial ? 'Seu período de teste gratuito foi ativado com sucesso.' : 'Sua assinatura foi confirmada com sucesso.'}</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Período:</strong> ${formattedStartDate} a ${formattedEndDate}</p>
            ${!isTrial ? `<p><strong>Valor:</strong> ${formattedAmount}</p>` : ''}
          </div>
          <p>${isTrial 
            ? 'Durante este período, você terá acesso a todas as funcionalidades do sistema. Aproveite para explorar todas as ferramentas disponíveis!' 
            : 'Com sua assinatura, você tem acesso a todas as funcionalidades do sistema QUERO FRETES para otimizar sua gestão de fretes.'}</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'https://querofretes.com.br'}" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar o Sistema</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de ${isTrial ? 'período de teste' : 'assinatura'} enviado para ${email}`);
  } catch (error) {
    console.error(`Erro ao enviar email de ${isTrial ? 'período de teste' : 'assinatura'}:`, error);
  }
}

/**
 * Envia um email de expiração de assinatura ou período de teste
 * @param email Email do destinatário
 * @param clientName Nome do cliente
 * @param isTrial Indica se é um período de teste
 * @param endDate Data de término
 */
export async function sendSubscriptionExpirationEmail(
  email: string,
  clientName: string,
  isTrial: boolean,
  endDate: Date
) {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de expiração não enviado.');
    return;
  }

  const formattedEndDate = new Date(endDate).toLocaleDateString('pt-BR');
  const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  try {
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isTrial 
        ? 'Seu período de teste está chegando ao fim - QUERO FRETES' 
        : 'Sua assinatura está prestes a expirar - QUERO FRETES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://seusite.com.br/logo.png" alt="QUERO FRETES" style="max-width: 200px;">
          </div>
          <h2 style="color: #4a6cf7;">${isTrial ? 'Seu período de teste está acabando' : 'Assinatura prestes a expirar'}</h2>
          <p>Olá, <strong>${clientName}</strong>!</p>
          <p>Gostaríamos de informar que ${isTrial ? 'seu período de teste' : 'sua assinatura'} no QUERO FRETES ${daysLeft > 0 ? 'expirará' : 'expirou'} ${daysLeft > 0 ? `em <strong>${daysLeft} dia${daysLeft > 1 ? 's' : ''}</strong>` : 'hoje'}.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Data de expiração:</strong> ${formattedEndDate}</p>
          </div>
          <p>${isTrial 
            ? 'Para continuar utilizando nosso sistema, recomendamos a assinatura de um de nossos planos.' 
            : 'Para continuar aproveitando todos os benefícios, renove sua assinatura antes da data de expiração.'}</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'https://querofretes.com.br'}/subscribe" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">${isTrial ? 'Assinar Agora' : 'Renovar Assinatura'}</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de expiração enviado para ${email}`);
  } catch (error) {
    console.error('Erro ao enviar email de expiração:', error);
    return false;
  }
  return true;
}

// Função para testar a conectividade do email
export async function testEmailConnection(): Promise<{ success: boolean; message: string; service?: string }> {
  if (!transporter) {
    return { success: false, message: "Serviço de email não configurado" };
  }

  try {
    await transporter.verify();
    const service = process.env.EMAIL_SERVICE || 'Ethereal';
    return { 
      success: true, 
      message: `Conexão com ${service} estabelecida com sucesso`,
      service: service
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

// Função para enviar email de teste
export async function sendTestEmail(targetEmail: string): Promise<{ success: boolean; message: string }> {
  if (!transporter) {
    return { success: false, message: "Serviço de email não configurado" };
  }

  try {
    console.log(`[EMAIL-TEST] Iniciando envio de teste para: ${targetEmail}`);
    console.log(`[EMAIL-TEST] Configuração atual:`, {
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
      passwordConfigured: !!process.env.EMAIL_PASSWORD
    });

    // Verificar se o EMAIL_USER é um email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.EMAIL_USER || '')) {
      throw new Error(`EMAIL_USER inválido: ${process.env.EMAIL_USER}. Deve ser um endereço de email válido.`);
    }

    const testMailOptions = {
      from: `"QUERO FRETES - Teste" <${process.env.EMAIL_USER || 'noreply@querofretes.com'}>`,
      to: targetEmail,
      subject: 'Teste de Configuração de Email - QUERO FRETES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6cf7;">Teste de Email - QUERO FRETES</h2>
          <p>Este é um email de teste para verificar se a configuração está funcionando corretamente.</p>
          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Serviço:</strong> ${process.env.EMAIL_SERVICE || 'Ethereal'}</p>
            <p><strong>Status:</strong> ✅ Configuração funcionando corretamente</p>
          </div>
          <p>Se você recebeu este email, significa que o sistema de envio está operacional.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    console.log(`[EMAIL-TEST] Opções do email:`, {
      from: testMailOptions.from,
      to: testMailOptions.to,
      subject: testMailOptions.subject
    });

    const result = await transporter.sendMail(testMailOptions);
    
    console.log(`[EMAIL-TEST] Email enviado com sucesso!`);
    console.log(`[EMAIL-TEST] MessageId:`, result.messageId);
    console.log(`[EMAIL-TEST] Response:`, result.response);
    
    // Se estiver usando Ethereal, mostrar preview URL
    if (result.messageId && process.env.EMAIL_SERVICE?.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      console.log(`[EMAIL-TEST] Preview URL (Ethereal):`, previewUrl);
      return { 
        success: true, 
        message: `Email de teste enviado! MessageID: ${result.messageId}. Preview: ${previewUrl}` 
      };
    }
    
    return { 
      success: true, 
      message: `Email de teste enviado com sucesso para ${targetEmail}. MessageID: ${result.messageId}` 
    };
  } catch (error) {
    console.error(`[EMAIL-TEST] Erro detalhado:`, error);
    return { 
      success: false, 
      message: `Erro ao enviar email de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Envia um email de cobrança para um usuário com cobrança PIX da OpenPix
 * @param user Objeto do usuário
 * @param customMessage Mensagem personalizada opcional
 */
export async function sendPaymentReminderEmail(
  user: User, 
  customMessage?: string
): Promise<{ success: boolean; charge?: any; error?: string }> {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de cobrança não enviado.');
    return { success: false, error: 'Serviço de email não configurado' };
  }

  if (!user.email) {
    console.warn('Usuário sem email. Email de cobrança não enviado.');
    return { success: false, error: 'Usuário sem email' };
  }

  try {
    // 1. Criar cobrança PIX na OpenPix
    const openPixConfig = {
      authorization: process.env.OPENPIX_AUTHORIZATION || '',
      apiUrl: 'https://api.openpix.com.br/api/v1'
    };

    const correlationID = `payment-reminder-${user.id}-${Date.now()}`;
    const chargeValue = 4990; // R$ 49,90 em centavos

    console.log('=== CRIANDO COBRANÇA PIX PARA EMAIL ===');
    console.log(`Usuário: ${user.name} (${user.email})`);
    console.log(`Valor: R$ 49,90`);

    const chargeData = {
      correlationID,
      value: chargeValue,
      comment: `Cobrança de assinatura QUERO FRETES - ${user.name}`,
      customer: {
        name: user.name,
        email: user.email
      },
      additionalInfo: [
        {
          key: 'userId',
          value: user.id.toString()
        },
        {
          key: 'type',
          value: 'subscription_reminder'
        }
      ]
    };

    const chargeResponse = await fetch(`${openPixConfig.apiUrl}/charge`, {
      method: 'POST',
      headers: {
        'Authorization': openPixConfig.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chargeData)
    });

    let charge = null;
    let pixCode = '';
    let paymentLink = '';
    let qrCodeImage = '';

    if (chargeResponse.ok) {
      const chargeResult = await chargeResponse.json();
      charge = chargeResult.charge;
      pixCode = charge?.brCode || '';
      paymentLink = charge?.paymentLinkUrl || '';
      qrCodeImage = charge?.qrCodeImage || '';
      
      console.log('Cobrança PIX criada com sucesso:', charge?.identifier);
    } else {
      console.warn('Erro ao criar cobrança PIX:', await chargeResponse.text());
    }

    // 2. Preparar email com dados da cobrança PIX
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00222d; margin: 0; font-size: 24px;">QUERO FRETES</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Sistema de Gestão de Fretes</p>
        </div>
        
        <h2 style="color: #00222d;">Olá, ${user.name}!</h2>
        <p style="color: #333; line-height: 1.6;">Estamos entrando em contato para lembrar sobre o pagamento da sua assinatura do QUERO FRETES.</p>
        
        ${customMessage ? `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #00222d; margin: 20px 0;">
            <p style="margin: 0; color: #333;">${customMessage}</p>
          </div>
        ` : ''}
        
        <div style="background-color: #f0f8ff; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h3 style="color: #00222d; margin: 0 0 15px 0;">💳 Pague via PIX - R$ 49,90</h3>
          <p style="color: #666; margin: 0 0 20px 0;">Pagamento instantâneo e seguro</p>
          
          ${qrCodeImage ? `
            <div style="margin: 20px 0;">
              <img src="${qrCodeImage}" alt="QR Code PIX" style="max-width: 200px; border: 2px solid #ddd; border-radius: 8px;">
              <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">Escaneie o QR Code com seu app do banco</p>
            </div>
          ` : ''}
          
          ${pixCode ? `
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #00222d;">Código PIX Copia e Cola:</p>
              <p style="font-family: monospace; font-size: 12px; word-break: break-all; margin: 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">${pixCode}</p>
            </div>
          ` : ''}
          
          ${paymentLink ? `
            <div style="margin: 20px 0;">
              <a href="${paymentLink}" style="background-color: #00222d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔗 Abrir Link de Pagamento
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <h4 style="color: #00222d;">Como pagar:</h4>
          <ol style="color: #333; line-height: 1.6;">
            <li>Escaneie o QR Code com seu app do banco</li>
            <li>OU copie e cole o código PIX</li>
            <li>OU clique no link de pagamento</li>
            <li>Confirme o pagamento de R$ 49,90</li>
          </ol>
        </div>
        
        <p style="color: #333; line-height: 1.6;">Após o pagamento, sua assinatura será ativada automaticamente em poucos minutos.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Importante:</strong> Se você já efetuou o pagamento recentemente, por favor desconsidere este email.</p>
        </div>
        
        <p style="color: #666;">Se precisar de ajuda ou tiver alguma dúvida, entre em contato conosco.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()} • Gestão Inteligente de Fretes
          </p>
        </div>
      </div>
    `;

    // 3. Enviar email
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '💳 Cobrança QUERO FRETES - Pague via PIX',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de cobrança com PIX enviado para ${user.email}`);
    
    return { 
      success: true, 
      charge: charge ? {
        id: charge.identifier,
        correlationID,
        value: chargeValue / 100,
        pixCode,
        paymentLink,
        qrCodeImage
      } : null
    };
    
  } catch (error) {
    console.error('Erro ao enviar email de cobrança com PIX:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia um email com link de recuperação de senha
 * @param email Email do usuário
 * @param resetToken Token de recuperação de senha
 * @param userName Nome do usuário (opcional)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de recuperação de senha não enviado.');
    return false;
  }

  // URL base da aplicação
  const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://querofretes.com.br');
  
  // Link de recuperação de senha
  const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  try {
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperação de Senha - QUERO FRETES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://seusite.com.br/logo.png" alt="QUERO FRETES" style="max-width: 200px;">
          </div>
          <h2 style="color: #4a6cf7;">Recuperação de Senha</h2>
          <p>Olá${userName ? `, <strong>${userName}</strong>` : ''}!</p>
          <p>Recebemos uma solicitação para redefinição de senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha. O link é válido por 24 horas.</p>
          
          <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <a href="${resetLink}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              REDEFINIR MINHA SENHA
            </a>
          </div>
          
          <p>Se você não solicitou a redefinição de senha, por favor ignore este email ou entre em contato com o suporte.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperação de senha enviado para ${email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    return false;
  }
}

/**
 * Envia um email de cancelamento de assinatura devido a reembolso
 * @param email Email do destinatário
 * @param clientName Nome do cliente
 * @param refundAmount Valor reembolsado
 * @param refundDate Data do reembolso
 */
export async function sendSubscriptionCancellationEmail(
  email: string,
  clientName: string,
  refundAmount: number,
  refundDate: Date
) {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de cancelamento não enviado.');
    return;
  }

  const formattedRefundDate = new Date(refundDate).toLocaleDateString('pt-BR');
  const formattedAmount = refundAmount.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });

  try {
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Assinatura cancelada - Reembolso processado - QUERO FRETES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00222d; margin: 0; font-size: 24px;">QUERO FRETES</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Sistema de Gestão de Fretes</p>
          </div>
          
          <h2 style="color: #dc3545;">Assinatura Cancelada</h2>
          <p>Olá, <strong>${clientName}</strong>!</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">ℹ️ Informações do Cancelamento</h3>
            <p style="margin: 0; color: #856404;">
              Sua assinatura foi cancelada automaticamente devido ao reembolso do pagamento.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #00222d; margin: 0 0 15px 0;">📋 Detalhes do Reembolso</h3>
            <p><strong>Data do reembolso:</strong> ${formattedRefundDate}</p>
            <p><strong>Valor reembolsado:</strong> ${formattedAmount}</p>
            <p><strong>Status da assinatura:</strong> <span style="color: #dc3545; font-weight: bold;">Cancelada</span></p>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin: 0 0 15px 0;">🔄 Quer reativar sua assinatura?</h3>
            <p style="color: #333; margin: 0 0 15px 0;">
              Você pode reativar sua assinatura a qualquer momento e continuar aproveitando todos os recursos do QUERO FRETES.
            </p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://querofretes.com.br'}/subscribe" 
                 style="background-color: #0066cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reativar Assinatura
              </a>
            </div>
          </div>
          
          <p style="color: #666; margin: 30px 0;">
            Se você tiver alguma dúvida sobre este cancelamento ou precisar de assistência, 
            entre em contato com nosso suporte.
          </p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de cancelamento de assinatura enviado para ${email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de cancelamento:', error);
    return false;
  }
}

// Função para enviar notificação de nova cotação para todos os clientes
export async function sendNewQuoteNotificationToClients(
  clients: Array<{ email: string; name: string }>,
  quoteDetails: {
    clientName: string;
    origin: string;
    destination: string;
    cargoType: string;
    weight: number;
  }
) {
  try {
    if (!transporter) {
      console.warn('Serviço de email não inicializado. Notificações não serão enviadas.');
      return { sent: 0, failed: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    // Enviar email para cada cliente
    for (const client of clients) {
      try {
        const mailOptions = {
          from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
          to: client.email,
          subject: '🚛 Nova Cotação Disponível - QUERO FRETES',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
              <div style="background-color: #00222d; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">QUERO FRETES</h1>
              </div>
              
              <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #00222d; margin: 0 0 20px 0;">Olá, ${client.name}!</h2>
                
                <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                  Uma nova cotação de frete foi cadastrada em nossa plataforma e pode ser do seu interesse:
                </p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #00222d; margin: 0 0 15px 0;">📦 Detalhes da Cotação</h3>
                  <p><strong>Cliente:</strong> ${quoteDetails.clientName}</p>
                  <p><strong>Origem:</strong> ${quoteDetails.origin}</p>
                  <p><strong>Destino:</strong> ${quoteDetails.destination}</p>
                  <p><strong>Tipo de Carga:</strong> ${quoteDetails.cargoType === 'completa' ? 'Carga Completa' : 'Complemento'}</p>
                  <p><strong>Peso:</strong> ${quoteDetails.weight} Kg</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://querofretes.com.br'}/quotes" 
                     style="background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Ver Cotação Completa
                  </a>
                </div>
                
                <p style="color: #666; margin: 30px 0; font-size: 14px;">
                  Acesse agora mesmo nossa plataforma para enviar sua proposta e ganhar este frete!
                </p>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
                  Este é um email automático, por favor não responda.<br>
                  QUERO FRETES © ${new Date().getFullYear()}
                </p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        sentCount++;
        console.log(`✅ Email de nova cotação enviado para ${client.email}`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Erro ao enviar email para ${client.email}:`, error);
      }
    }

    console.log(`📧 Notificações enviadas: ${sentCount} sucesso, ${failedCount} falhas`);
    return { sent: sentCount, failed: failedCount };
  } catch (error) {
    console.error('Erro geral ao enviar notificações:', error);
    return { sent: 0, failed: clients.length };
  }
}
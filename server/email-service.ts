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

      console.log(`[EMAIL-CONFIG] Configuração SMTP:`, {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        service: emailConfig.service || 'custom',
        user: process.env.EMAIL_USER
      });
      
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

  try {
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
          <p>Para aproveitar ao máximo nosso sistema:</p>
          <ol>
            <li>Complete seu cadastro de cliente na aba "Clientes"</li>
            <li>Explore as funcionalidades disponíveis para seu tipo de perfil</li>
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
    'trial': 'Período de Teste (7 dias)'
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
 * Envia um email de cobrança para um usuário
 * @param user Objeto do usuário
 * @param customMessage Mensagem personalizada opcional
 */
export async function sendPaymentReminderEmail(
  user: User, 
  customMessage?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn('Serviço de email não configurado. Email de cobrança não enviado.');
    return false;
  }

  try {
    const mailOptions = {
      from: `"QUERO FRETES" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Lembrete de Pagamento - QUERO FRETES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://seusite.com.br/logo.png" alt="QUERO FRETES" style="max-width: 200px;">
          </div>
          <h2 style="color: #4a6cf7;">Olá, ${user.name}!</h2>
          <p>Estamos entrando em contato para lembrar sobre o pagamento pendente da sua assinatura do QUERO FRETES.</p>
          
          ${customMessage ? `<p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #4a6cf7;">${customMessage}</p>` : ''}
          
          <p>Para continuar aproveitando todos os recursos da nossa plataforma sem interrupções, por favor, regularize seu pagamento o mais breve possível.</p>
          
          <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <a href="${process.env.APP_URL || 'https://querofretes.com.br'}/pagamento" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              REGULARIZAR PAGAMENTO
            </a>
          </div>
          
          <p>Se você já efetuou o pagamento recentemente, por favor desconsidere este email.</p>
          <p>Se precisar de ajuda ou tiver alguma dúvida sobre sua fatura, entre em contato conosco.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático, por favor não responda.<br>
            QUERO FRETES © ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de cobrança enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de cobrança:', error);
    return false;
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
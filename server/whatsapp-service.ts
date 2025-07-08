const { Client, LocalAuth } = require('whatsapp-web.js');
import QRCode from 'qrcode';
import { Request, Response } from 'express';

class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string = '';
  private isReady: boolean = false;
  private isConnecting: boolean = false;
  private status: string = 'disconnected';

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (this.client) {
      this.client.destroy();
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "quero-fretes-client"
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      console.log('QR Code recebido, gerando imagem...');
      try {
        this.qrCode = await QRCode.toDataURL(qr);
        this.status = 'qr_ready';
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    });

    this.client.on('ready', () => {
      console.log('WhatsApp Client está pronto!');
      this.isReady = true;
      this.isConnecting = false;
      this.status = 'connected';
      this.qrCode = '';
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp Client autenticado!');
      this.status = 'authenticated';
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Falha na autenticação:', msg);
      this.status = 'auth_failed';
      this.isConnecting = false;
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp Client desconectado:', reason);
      this.isReady = false;
      this.status = 'disconnected';
      this.qrCode = '';
    });
  }

  async connect() {
    if (this.isConnecting || this.isReady) {
      return;
    }

    this.isConnecting = true;
    this.status = 'connecting';
    
    try {
      if (!this.client) {
        this.initializeClient();
      }
      await this.client!.initialize();
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      this.isConnecting = false;
      this.status = 'error';
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
    this.isReady = false;
    this.isConnecting = false;
    this.status = 'disconnected';
    this.qrCode = '';
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      status: this.status,
      qrCode: this.qrCode
    };
  }

  isWhatsAppReady() {
    return this.isReady;
  }

  async sendMessage(chatId: string, message: string) {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      await this.client.sendMessage(chatId, message);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async getChats() {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chats = await this.client.getChats();
      return chats
        .filter(chat => chat.isGroup)
        .map(chat => ({
          id: chat.id._serialized,
          name: chat.name,
          participants: chat.participants?.length || 0
        }));
    } catch (error) {
      console.error('Erro ao obter chats:', error);
      throw error;
    }
  }

  async sendFreightToGroups(freightMessage: string, groupIds: string[]) {
    if (!this.isReady || !this.client) {
      console.log('WhatsApp não está conectado, pulando envio');
      return { success: false, error: 'WhatsApp não conectado' };
    }

    const results = [];
    
    for (const groupId of groupIds) {
      try {
        await this.sendMessage(groupId, freightMessage);
        results.push({ groupId, success: true });
        console.log(`Mensagem enviada para grupo ${groupId}`);
      } catch (error) {
        console.error(`Erro ao enviar para grupo ${groupId}:`, error);
        results.push({ groupId, success: false, error: error.message });
      }
    }

    return { success: true, results };
  }
}

// Instância singleton
const whatsappService = new WhatsAppService();

/**
 * Envia mensagem de boas-vindas via WhatsApp para usuário recém-cadastrado
 * @param user Objeto do usuário
 */
export async function sendWelcomeWhatsApp(user: any) {
  if (!whatsappService.isWhatsAppReady()) {
    console.log('WhatsApp não está conectado. Mensagem de boas-vindas não enviada.');
    return false;
  }

  try {
    // Verificar se o usuário tem WhatsApp cadastrado
    const phoneNumber = user.whatsapp || user.phone;
    
    if (!phoneNumber) {
      console.log(`Usuário ${user.name} não possui WhatsApp cadastrado`);
      return false;
    }

    // Formatar número para formato WhatsApp (55 + DDD + número)
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    let chatId;
    
    // Se o número já tem código do país, usar direto
    if (formattedNumber.length >= 12 && formattedNumber.startsWith('55')) {
      chatId = `${formattedNumber}@c.us`;
    } else {
      // Adicionar código do Brasil se necessário
      chatId = `55${formattedNumber}@c.us`;
    }

    // Criar mensagem personalizada baseada no perfil
    let welcomeMessage = `🎉 *Bem-vindo ao QUERO FRETES!* 🎉

Olá, *${user.name}*!

Seu cadastro foi realizado com sucesso! 🚛

📋 *Seus dados:*
📧 Email: ${user.email}
👤 Perfil: ${user.profileType === 'motorista' ? 'Motorista' : user.profileType === 'embarcador' ? 'Embarcador' : user.profileType === 'agenciador' ? 'Agenciador' : 'Transportador'}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}`;

    // Adicionar informações específicas por perfil
    if (user.profileType === 'motorista') {
      welcomeMessage += `

✅ *Acesso liberado!*
Como motorista, você já tem acesso completo ao sistema.

🔧 *Próximos passos:*
• Complete seu perfil na aba "Motoristas"
• Cadastre seus veículos
• Explore os fretes disponíveis`;
    } else {
      welcomeMessage += `

💳 *Ativação de assinatura:*
Para acessar todas as funcionalidades, ative sua assinatura de R$ 49,90/mês.

🔧 *Próximos passos:*
• Ative sua assinatura via PIX
• Complete seu perfil de cliente
• Comece a publicar fretes`;
    }

    welcomeMessage += `

📱 *Suporte:*
Dúvidas? Entre em contato:
WhatsApp: (31) 97155-9484

Obrigado por escolher o QUERO FRETES! 🚚💨

*Sistema automatizado QUERO FRETES*`;

    // Enviar mensagem
    await whatsappService.sendMessage(chatId, welcomeMessage);
    console.log(`✅ Mensagem de boas-vindas enviada via WhatsApp para ${user.name} (${phoneNumber})`);
    return true;

  } catch (error) {
    console.error(`❌ Erro ao enviar WhatsApp de boas-vindas para ${user.name}:`, error);
    return false;
  }
}

// Rotas para gerenciar WhatsApp
export function setupWhatsAppRoutes(app: any) {
  // Status da conexão
  app.get('/api/whatsapp/status', (req: Request, res: Response) => {
    res.json(whatsappService.getStatus());
  });

  // Conectar WhatsApp
  app.post('/api/whatsapp/connect', async (req: Request, res: Response) => {
    try {
      await whatsappService.connect();
      res.json({ success: true, message: 'Conectando...' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Desconectar WhatsApp
  app.post('/api/whatsapp/disconnect', async (req: Request, res: Response) => {
    try {
      await whatsappService.disconnect();
      res.json({ success: true, message: 'Desconectado' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Obter grupos
  app.get('/api/whatsapp/groups', async (req: Request, res: Response) => {
    try {
      const groups = await whatsappService.getChats();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Enviar mensagem de teste
  app.post('/api/whatsapp/test', async (req: Request, res: Response) => {
    try {
      const { groupId, message } = req.body;
      await whatsappService.sendMessage(groupId, message || 'Teste de mensagem do QUERO FRETES');
      res.json({ success: true, message: 'Mensagem enviada' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Enviar mensagem para todos os clientes cadastrados
  app.post('/api/whatsapp/broadcast', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Mensagem é obrigatória' 
        });
      }

      // Importar storage para buscar clientes
      const { storage } = await import('./storage');
      
      // Buscar todos os clientes cadastrados
      const clients = await storage.getClients();
      
      if (clients.length === 0) {
        return res.json({ 
          success: true, 
          message: 'Nenhum cliente encontrado para enviar mensagens',
          results: []
        });
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const client of clients) {
        try {
          // Usar o WhatsApp do cliente ou o telefone principal
          const phoneNumber = client.whatsapp || client.phone;
          
          if (!phoneNumber) {
            results.push({
              clientId: client.id,
              clientName: client.name,
              success: false,
              error: 'Cliente não possui WhatsApp ou telefone cadastrado'
            });
            errorCount++;
            continue;
          }

          // Formatar número para formato WhatsApp (55 + DDD + número)
          const formattedNumber = phoneNumber.replace(/\D/g, '');
          const chatId = `55${formattedNumber}@c.us`;
          
          // Personalizar mensagem com nome do cliente
          const personalizedMessage = `Olá, ${client.name}!\n\n${message}`;
          
          await whatsappService.sendMessage(chatId, personalizedMessage);
          
          results.push({
            clientId: client.id,
            clientName: client.name,
            phone: phoneNumber,
            success: true
          });
          successCount++;

          // Aguardar 2 segundos entre envios para evitar spam
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Erro ao enviar para cliente ${client.name}:`, error);
          results.push({
            clientId: client.id,
            clientName: client.name,
            phone: client.whatsapp || client.phone,
            success: false,
            error: error.message
          });
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `Envio concluído: ${successCount} sucessos, ${errorCount} erros`,
        summary: {
          totalClients: clients.length,
          successCount,
          errorCount
        },
        results
      });

    } catch (error) {
      console.error('Erro no broadcast WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
}

export { whatsappService };
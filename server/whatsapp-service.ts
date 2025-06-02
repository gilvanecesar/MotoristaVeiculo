import { Client, LocalAuth } from 'whatsapp-web.js';
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
}

export { whatsappService };
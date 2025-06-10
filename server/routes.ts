import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { sendPasswordResetEmail, testEmailConnection, sendTestEmail } from "./email-service";

// Vamos criar um mockup do Stripe para resolver erros de compilação
// até que todas as referências possam ser removidas
const Stripe = function(apiKey: string, options: any) {
  return {
    paymentIntents: {
      create: async () => ({ client_secret: 'mockup' }),
      retrieve: async () => ({ id: 'mockup' }),
    },
    subscriptions: {
      create: async () => ({ id: 'mockup', latest_invoice: { payment_intent: { client_secret: 'mockup' } } }),
      retrieve: async () => ({ id: 'mockup', status: 'active', latest_invoice: { payment_intent: { client_secret: 'mockup' } } }),
    },
    customers: {
      create: async () => ({ id: 'mockup' }),
      retrieve: async () => ({ id: 'mockup' }),
    },
    products: {
      retrieve: async () => ({ name: 'mockup' }),
    },
    prices: {
      retrieve: async () => ({ product: 'mockup' }),
    }
  };
} as any;
import { 
  isAuthenticated, 
  isActive, 
  hasActiveSubscription, 
  isAdmin, 
  isAdminOrSelf, 
  hasClientAccess, 
  hasDriverAccess, 
  canEditDriver,
  hasFreightAccess, 
  hasVehicleAccess 
} from "./middlewares";
import { 
  Driver, 
  InsertDriver, 
  FreightDestination, 
  Vehicle
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendSubscriptionEmail, sendPaymentReminderEmail } from "./email-service";
import { format } from "date-fns";
import { setupMercadoPagoRoutes } from "./mercadopago-routes";
import { setupWebhookRoutes, sendFreightWebhook } from "./webhook-service";
// import { setupWhatsAppRoutes } from "./whatsapp-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  
  // Configurar rotas do Mercado Pago
  setupMercadoPagoRoutes(app);
  
  // Configurar rotas do webhook
  setupWebhookRoutes(app);
  
  // Configurar rotas do WhatsApp
  // setupWhatsAppRoutes(app);
  
  // Rota para solicitar redefinição de senha
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const result = await storage.createPasswordResetToken(email);
      
      if (!result) {
        // Não informar ao usuário se o email existe ou não por segurança
        return res.status(200).json({ message: "Se o email estiver registrado, você receberá instruções para redefinir sua senha." });
      }
      
      // Enviar email de recuperação de senha
      try {
        const emailSent = await sendPasswordResetEmail(email, result.token, result.user.name);
        
        if (emailSent) {
          console.log(`Email de recuperação de senha enviado para ${email}`);
        } else {
          console.warn(`Falha ao enviar email de recuperação de senha para ${email}`);
        }
      } catch (emailError) {
        console.error("Erro ao enviar email de recuperação:", emailError);
        // Não falhar a requisição mesmo se o email não for enviado
      }
      
      res.status(200).json({ 
        message: "Se o email estiver registrado, você receberá instruções para redefinir sua senha."
      });
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      res.status(500).json({ message: "Erro ao processar a solicitação" });
    }
  });
  
  // Rota para redefinir senha usando token
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, token, newPassword } = req.body;
      
      if (!email || !token || !newPassword) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      // Verificar token
      const user = await storage.verifyPasswordResetToken(token, email);
      
      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      
      // Atualizar senha
      const hashedPassword = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao processar a solicitação" });
    }
  });
  
  // Ativar período de teste
  app.post("/api/activate-trial", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário já utilizou o período de teste
      if (user.subscriptionType === 'trial' || user.subscriptionExpiresAt) {
        return res.status(400).json({ message: "Você já utilizou seu período de teste" });
      }
      
      // Calcular data de expiração (7 dias a partir de agora)
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 7);
      
      // Atualizar usuário com informações de trial
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: 'trial',
        subscriptionExpiresAt: expirationDate,
      });
      
      res.status(200).json({ 
        message: "Período de teste ativado com sucesso",
        expiresAt: expirationDate,
      });
    } catch (error) {
      console.error("Erro ao ativar período de teste:", error);
      res.status(500).json({ message: "Erro ao ativar período de teste" });
    }
  });
  
  // Ativar acesso de motorista
  app.post("/api/activate-driver-access", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Se o usuário já tem acesso como motorista
      if (user.profileType === 'driver') {
        return res.status(400).json({ message: "Você já tem acesso como motorista" });
      }
      
      // Atualizar usuário com perfil de motorista
      await storage.updateUser(userId, {
        profileType: 'driver',
        // Não precisa de assinatura ativa para ser motorista, apenas acesso restrito
      });
      
      res.status(200).json({ 
        message: "Acesso como motorista ativado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao ativar acesso de motorista:", error);
      res.status(500).json({ message: "Erro ao ativar acesso de motorista" });
    }
  });

  // ==================== DRIVERS ====================
  // Obter todos motoristas com seus veículos
  app.get("/api/drivers", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      // Obter todos os motoristas
      const drivers = await storage.getDrivers();
      
      // Para cada motorista, buscar seus veículos
      const driversWithVehicles = await Promise.all(
        drivers.map(async (driver) => {
          const vehicles = await storage.getVehiclesByDriver(driver.id);
          return {
            ...driver,
            vehicles: vehicles || [],
            // Garantir que a categoria CNH seja sempre uma string válida para exibição
            cnhCategory: driver.cnhCategory || "Não informada"
          };
        })
      );
      
      console.log(`Carregados ${drivers.length} motoristas com seus veículos`);
      res.json(driversWithVehicles);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Obter motorista por ID com seus veículos
  app.get("/api/drivers/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await storage.getDriver(id);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      // Buscar veículos associados ao motorista
      const vehicles = await storage.getVehiclesByDriver(id);
      
      // Retornar motorista com seus veículos
      res.json({
        ...driver,
        vehicles: vehicles || [],
        // Garantir que a categoria CNH seja sempre uma string válida para exibição
        cnhCategory: driver.cnhCategory || "Não informada"
      });
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  // Criar novo motorista
  app.post("/api/drivers", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const driverData: InsertDriver = {
        ...req.body
      };
      
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  // Atualizar motorista existente
  app.put("/api/drivers/:id", canEditDriver, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const driverData = req.body;
      
      const updatedDriver = await storage.updateDriver(id, driverData);
      
      if (!updatedDriver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  // Excluir motorista
  app.delete("/api/drivers/:id", canEditDriver, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o motorista existe antes de excluir
      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      // Excluir motorista
      const success = await storage.deleteDriver(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete driver" });
      }
      
      res.status(200).json({ message: "Driver deleted successfully" });
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // ==================== VEHICLES ====================
  // Obter todos veículos do usuário logado
  app.get("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      let vehicles: Vehicle[];
      
      // Se um ID de motorista for especificado, filtrar por esse motorista (mas ainda do usuário logado)
      if (req.query.driverId) {
        const driverId = parseInt(req.query.driverId as string);
        vehicles = await storage.getVehiclesByDriverAndUser(driverId, userId);
      } else {
        // Retornar apenas veículos do usuário logado
        vehicles = await storage.getVehiclesByUser(userId);
      }
      
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Obter veículo por ID (apenas se pertencer ao usuário logado)
  app.get("/api/vehicles/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const vehicle = await storage.getVehicleByIdAndUser(id, userId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found or access denied" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  // Criar novo veículo (automaticamente vinculado ao usuário logado)
  app.post("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const vehicleData = {
        ...req.body,
        userId: req.user!.id // Garantir que o veículo seja vinculado ao usuário logado
      };
      
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Atualizar veículo existente
  app.put("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicleData = req.body;
      
      const updatedVehicle = await storage.updateVehicle(id, vehicleData);
      
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(updatedVehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  // Excluir veículo
  app.delete("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o veículo existe antes de excluir
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Excluir veículo
      const success = await storage.deleteVehicle(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete vehicle" });
      }
      
      res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // ==================== CLIENTS ====================
  // Obter todos clientes
  app.get("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Obter cliente por ID
  app.get("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Criar novo cliente
  app.post("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientData = req.body;
      
      // Verificar se já existe um cliente com o mesmo CNPJ
      const existingClientByCnpj = await storage.getClientByCnpj(clientData.cnpj);
      if (existingClientByCnpj) {
        return res.status(400).json({ 
          message: "CNPJ já cadastrado no sistema. Não é possível cadastrar clientes com o mesmo CNPJ." 
        });
      }
      
      // Verificar se já existe um cliente com o mesmo nome (case insensitive), mas permitir que o usuário atual crie um cliente com seu próprio nome
      const existingClientByName = await storage.getClientByName(clientData.name);
      
      // Apenas rejeitar se o nome já existir E não for o nome do usuário atual
      if (existingClientByName && clientData.name !== req.user?.name) {
        return res.status(400).json({ 
          message: "Nome já cadastrado no sistema. Por favor, use um nome diferente." 
        });
      }
      
      // Criar o cliente
      const client = await storage.createClient(clientData);
      
      // Associar o cliente ao usuário atual
      if (req.user && req.user.id) {
        // Atualizar o usuário com o ID do cliente
        await storage.updateUser(req.user.id, {
          clientId: client.id
        });
        
        console.log(`Cliente ID ${client.id} associado ao usuário ID ${req.user.id}`);
      }
      
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Falha ao criar cliente. Verifique os dados e tente novamente." });
    }
  });

  // Atualizar cliente existente
  app.put("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = req.body;
      
      // Verificar se já existe um cliente com o mesmo CNPJ (diferente do atual)
      const existingClientByCnpj = await storage.getClientByCnpj(clientData.cnpj);
      if (existingClientByCnpj && existingClientByCnpj.id !== id) {
        return res.status(400).json({ 
          message: "CNPJ já cadastrado no sistema. Não é possível ter dois clientes com o mesmo CNPJ." 
        });
      }
      
      // Verificar se já existe um cliente com o mesmo nome (case insensitive e diferente do atual)
      const existingClientByName = await storage.getClientByName(clientData.name);
      if (existingClientByName && existingClientByName.id !== id) {
        return res.status(400).json({ 
          message: "Nome já cadastrado no sistema. Por favor, use um nome diferente." 
        });
      }
      
      const updatedClient = await storage.updateClient(id, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Falha ao atualizar cliente. Verifique os dados e tente novamente." });
    }
  });

  // Excluir cliente
  app.delete("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o cliente existe antes de excluir
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Excluir cliente
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete client" });
      }
      
      res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // ==================== FREIGHTS ====================
  // Obter todos fretes, com opção de filtro por cliente
  app.get("/api/freights", isAuthenticated, async (req: Request, res: Response) => {
    try {      
      let freights: FreightWithClient[];
      
      // Se um ID de cliente for especificado, filtrar por esse cliente
      if (req.query.clientId) {
        const clientId = parseInt(req.query.clientId as string);
        // Filtrar fretes por cliente usando o método getFreights e filtrando depois
        const allFreights = await storage.getFreights();
        freights = allFreights.filter(f => f.clientId === clientId);
      } else {
        // Obter todos os fretes independente do perfil do usuário
        // Os filtros por cliente serão aplicados no frontend conforme necessário
        freights = await storage.getFreights();
      }
      
      if (req.query.active === 'true') {
        // Filtrar apenas fretes ativos
        const now = new Date();
        freights = freights.filter(freight => 
          new Date(freight.expirationDate) > now && freight.status === 'active'
        );
      }
      
      res.json(freights);
    } catch (error) {
      console.error("Error fetching freights:", error);
      res.status(500).json({ message: "Failed to fetch freights" });
    }
  });

  // Obter frete por ID
  app.get("/api/freights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const freight = await storage.getFreight(id);
      
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Obter destinos múltiplos se existirem
      let destinations: FreightDestination[] = [];
      if (freight.hasMultipleDestinations) {
        destinations = await storage.getFreightDestinations(id);
      }
      
      res.json({
        ...freight,
        destinations
      });
    } catch (error) {
      console.error("Error fetching freight:", error);
      res.status(500).json({ message: "Failed to fetch freight" });
    }
  });

  // Criar novo frete (rota principal com verificação de assinatura)
  app.post("/api/freights", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const freightData = req.body;
      
      // Associar o user ID atual
      freightData.userId = req.user?.id || null;
      
      // Garantir que o status é 'active' inicialmente
      freightData.status = 'active';
      
      // Definir data de criação automaticamente
      freightData.createdAt = new Date();
      
      // Se não for enviada uma data de expiração, definir para 24h no futuro
      if (!freightData.expirationDate) {
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 24);
        freightData.expirationDate = expirationDate;
      }
      
      // Os destinos múltiplos são salvos separadamente via API específica
      // Removemos destinations do payload se existir
      console.log("Dados completos do frete:", freightData);
      delete freightData.destinations;
      
      // Formatar o valor do frete para o padrão do banco
      if (freightData.freightValue) {
        // Garantir que o valor seja tratado como uma string para manipulação
        let valueStr = String(freightData.freightValue);
        
        // Remover pontos de milhares e substituir vírgula por ponto para o formato padrão do banco
        valueStr = valueStr.replace(/\./g, '').replace(',', '.');
        
        // Converter para número com formatação adequada
        // Verificar se o valor parece estar no formato com centavos ou se precisa converter
        let numValue;
        
        // Se o valor contém ponto decimal, presume-se que já esteja no formato correto
        if (valueStr.includes('.')) {
          numValue = parseFloat(valueStr);
        } else {
          // Verificar o tamanho da string para determinar se precisa de conversão
          if (valueStr.length > 2) {
            // Dividir em parte inteira e decimal
            const intPart = valueStr.slice(0, -2) || '0';
            const decPart = valueStr.slice(-2);
            numValue = parseFloat(`${intPart}.${decPart}`);
          } else {
            // Número pequeno, provavelmente já está no formato correto
            numValue = parseFloat(valueStr);
          }
        }
        
        // Para manter o formato com 2 casas decimais como string
        freightData.freightValue = numValue.toFixed(2);
        
        console.log("Valor do frete formatado (criação):", freightData.freightValue);
      }
      
      // Formatar o peso da carga para o padrão do banco
      if (freightData.cargoWeight) {
        // Garantir que o peso seja tratado como uma string para manipulação
        let weightStr = String(freightData.cargoWeight);
        
        // Remover pontos de milhares e substituir vírgula por ponto
        weightStr = weightStr.replace(/\./g, '').replace(',', '.');
        
        // Converter para número decimal
        let weightValue = parseFloat(weightStr);
        
        // Se não é um número válido, usar 0
        if (isNaN(weightValue)) {
          weightValue = 0;
        }
        
        // Para manter o formato com 2 casas decimais como string
        freightData.cargoWeight = weightValue.toFixed(2);
        
        console.log("Peso da carga formatado (criação):", freightData.cargoWeight);
      }
      
      // Criar o frete
      const freight = await storage.createFreight(freightData);
      
      // Enviar webhook após criação do frete
      try {
        const client = await storage.getClient(freight.clientId);
        await sendFreightWebhook(freight, client);
        console.log(`Webhook enviado para frete ${freight.id}`);
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError);
        // Não falhar a criação do frete por causa do webhook
      }
      
      res.status(201).json(freight);
    } catch (error) {
      console.error("Error creating freight:", error);
      res.status(500).json({ message: "Failed to create freight" });
    }
  });

  // Atualizar frete existente
  app.put("/api/freights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const freightData = req.body;
      
      // Separar os destinos dos dados do frete principal
      const destinations = freightData.destinations || [];
      delete freightData.destinations;
      
      // Garantir que as datas estejam no formato correto ou sejam removidas
      if (freightData.expirationDate && typeof freightData.expirationDate === 'string') {
        try {
          freightData.expirationDate = new Date(freightData.expirationDate);
        } catch (error) {
          delete freightData.expirationDate;
        }
      }
      
      if (freightData.createdAt && typeof freightData.createdAt === 'string') {
        try {
          freightData.createdAt = new Date(freightData.createdAt);
        } catch (error) {
          delete freightData.createdAt;
        }
      }
      
      // Corrigir o formato do valor do frete para evitar zeros extras
      if (freightData.freightValue) {
        // Garantir que o valor seja tratado como uma string para manipulação
        let valueStr = String(freightData.freightValue);
        
        // Remover pontos de milhares e substituir vírgula por ponto para o formato padrão do banco
        valueStr = valueStr.replace(/\./g, '').replace(',', '.');
        
        // Converter para número com formatação adequada
        // Verificar se o valor parece estar no formato com centavos ou se precisa converter
        let numValue;
        
        // Se o valor contém ponto decimal, presume-se que já esteja no formato correto
        if (valueStr.includes('.')) {
          numValue = parseFloat(valueStr);
        } else {
          // Verificar o tamanho da string para determinar se precisa de conversão
          if (valueStr.length > 2) {
            // Provavelmente está em centavos, manter como está (ex: 3800.00 -> 3800.00)
            const intPart = valueStr.slice(0, -2) || '0';
            const decPart = valueStr.slice(-2);
            numValue = parseFloat(`${intPart}.${decPart}`);
          } else {
            // Número pequeno, provavelmente já está no formato correto
            numValue = parseFloat(valueStr);
          }
        }
        
        // Para manter o formato com 2 casas decimais como string
        freightData.freightValue = numValue.toFixed(2);
        
        console.log("Valor do frete formatado:", freightData.freightValue);
      }
      
      // Formatar o peso da carga para o padrão do banco
      if (freightData.cargoWeight) {
        // Garantir que o peso seja tratado como uma string para manipulação
        let weightStr = String(freightData.cargoWeight);
        
        // Remover pontos de milhares e substituir vírgula por ponto
        weightStr = weightStr.replace(/\./g, '').replace(',', '.');
        
        // Converter para número decimal
        let weightValue = parseFloat(weightStr);
        
        // Se não é um número válido, usar 0
        if (isNaN(weightValue)) {
          weightValue = 0;
        }
        
        // Para manter o formato com 2 casas decimais como string
        freightData.cargoWeight = weightValue.toFixed(2);
        
        console.log("Peso da carga formatado (atualização):", freightData.cargoWeight);
      }
      
      // Remover campos que podem causar problemas na atualização
      delete freightData.id; // Evita conflito com o ID na rota
      
      console.log("Dados para atualização de frete:", { 
        id, 
        expirationDate: freightData.expirationDate,
        createdAt: freightData.createdAt
      });
      
      // Atualizar dados do frete
      const updatedFreight = await storage.updateFreight(id, freightData);
      
      if (!updatedFreight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Se há destinos múltiplos, atualizar ou criar
      if (destinations && destinations.length > 0) {
        // Primeiro obter os destinos existentes
        const existingDestinations = await storage.getFreightDestinations(id);
        const existingIds = existingDestinations.map(d => d.id);
        
        // Atualizar/criar destinos
        for (const dest of destinations) {
          if (dest.id && existingIds.includes(dest.id)) {
            // Atualizar destino existente
            await storage.updateFreightDestination(dest.id, {
              destination: dest.destination,
              destinationState: dest.destinationState,
              arrivalDate: dest.arrivalDate || null,
              destinationContact: dest.destinationContact || null,
              destinationPhone: dest.destinationPhone || null,
              destinationAddress: dest.destinationAddress || null,
              destinationNotes: dest.destinationNotes || null,
            });
          } else {
            // Criar novo destino
            await storage.createFreightDestination({
              freightId: id,
              destination: dest.destination,
              destinationState: dest.destinationState,
              arrivalDate: dest.arrivalDate || null,
              destinationContact: dest.destinationContact || null,
              destinationPhone: dest.destinationPhone || null,
              destinationAddress: dest.destinationAddress || null,
              destinationNotes: dest.destinationNotes || null,
            });
          }
        }
        
        // Atualizar o frete para indicar que tem múltiplos destinos
        await storage.updateFreight(id, { hasMultipleDestinations: true });
      }
      
      // Obter o frete atualizado com seus destinos
      const freightWithDestinations = await storage.getFreight(id);
      if (!freightWithDestinations) {
        return res.status(404).json({ message: "Freight not found after update" });
      }
      
      let destinationsResult: FreightDestination[] = [];
      if (freightWithDestinations.hasMultipleDestinations) {
        destinationsResult = await storage.getFreightDestinations(id);
      }
      
      res.json({
        ...freightWithDestinations,
        destinations: destinationsResult
      });
    } catch (error) {
      console.error("Error updating freight:", error);
      res.status(500).json({ message: "Failed to update freight" });
    }
  });

  // Rota simplificada para atualizar apenas o valor do frete, sem verificações rigorosas de acesso
  app.post("/api/freights/:id/update-value", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o frete existe antes de atualizar
      const freight = await storage.getFreight(id);
      if (!freight) {
        return res.status(404).json({ message: "Frete não encontrado" });
      }
      
      // Obter valor do frete da requisição
      const { freightValue } = req.body;
      
      if (!freightValue) {
        return res.status(400).json({ message: "Valor do frete é obrigatório" });
      }
      
      console.log(`[API] Atualizando valor do frete ${id} para ${freightValue}`);
      
      // Atualizar apenas o valor do frete
      const updatedFreight = await storage.updateFreight(id, { freightValue });
      
      // Obter o frete atualizado
      const freightUpdated = await storage.getFreight(id);
      
      console.log(`[API] Frete ${id} atualizado com sucesso para valor ${freightValue}`);
      
      res.json(freightUpdated);
    } catch (error) {
      console.error("Erro ao atualizar valor do frete:", error);
      res.status(500).json({ message: "Falha ao atualizar valor do frete" });
    }
  });
  
  // Excluir frete
  app.delete("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o frete existe antes de excluir
      const freight = await storage.getFreight(id);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Se tiver múltiplos destinos, excluí-los primeiro
      if (freight.hasMultipleDestinations) {
        const destinations = await storage.getFreightDestinations(id);
        for (const dest of destinations) {
          await storage.deleteFreightDestination(dest.id);
        }
      }
      
      // Excluir frete
      const success = await storage.deleteFreight(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete freight" });
      }
      
      res.status(200).json({ message: "Freight deleted successfully" });
    } catch (error) {
      console.error("Error deleting freight:", error);
      res.status(500).json({ message: "Failed to delete freight" });
    }
  });

  // ==================== FREIGHT DESTINATIONS ====================
  // Obter destinos de frete por ID de frete
  app.get("/api/freight-destinations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const freightId = req.query.freightId ? parseInt(req.query.freightId as string) : undefined;
      
      if (!freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      const destinations = await storage.getFreightDestinations(freightId);
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching freight destinations:", error);
      res.status(500).json({ message: "Failed to fetch freight destinations" });
    }
  });

  // Criar novo destino para um frete
  app.post("/api/freight-destinations", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const destinationData = req.body;
      
      if (!destinationData.freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      // Verificar se o frete existe
      const freight = await storage.getFreight(destinationData.freightId);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Criar o destino
      const destination = await storage.createFreightDestination(destinationData);
      
      // Atualizar o frete para indicar que tem múltiplos destinos
      await storage.updateFreight(destinationData.freightId, { hasMultipleDestinations: true });
      
      res.status(201).json(destination);
    } catch (error) {
      console.error("Error creating freight destination:", error);
      res.status(500).json({ message: "Failed to create freight destination" });
    }
  });

  // Excluir destino de frete
  app.delete("/api/freight-destinations/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o destino existe antes de excluir
      const destination = await storage.getFreightDestination(id);
      if (!destination) {
        return res.status(404).json({ message: "Freight destination not found" });
      }
      
      // Excluir destino
      const success = await storage.deleteFreightDestination(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete freight destination" });
      }
      
      // Verificar se ainda existem destinos para este frete
      const remainingDestinations = await storage.getFreightDestinations(destination.freightId);
      
      // Se não houver mais destinos, atualizar o frete
      if (remainingDestinations.length === 0) {
        await storage.updateFreight(destination.freightId, { hasMultipleDestinations: false });
      }
      
      res.status(200).json({ message: "Freight destination deleted successfully" });
    } catch (error) {
      console.error("Error deleting freight destination:", error);
      res.status(500).json({ message: "Failed to delete freight destination" });
    }
  });

  // ==================== USER PROFILE ====================
  // Atualizar tipo de perfil do usuário
  app.post("/api/users/update-profile-type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const { profileType } = req.body;
      
      if (!profileType || !['admin', 'client', 'driver', 'agent', 'shipper'].includes(profileType)) {
        return res.status(400).json({ message: "Tipo de perfil inválido" });
      }
      
      const updatedUser = await storage.updateUser(userId, { profileType });
      
      res.json({
        message: "Tipo de perfil atualizado com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao atualizar tipo de perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar tipo de perfil" });
    }
  });

  // Associar usuário a um cliente
  app.post("/api/users/associate-client", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "ID do cliente é obrigatório" });
      }
      
      // Verificar se o cliente existe
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      const updatedUser = await storage.updateUser(userId, { clientId });
      
      res.json({
        message: "Usuário associado ao cliente com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao associar usuário a cliente:", error);
      res.status(500).json({ message: "Erro ao associar usuário a cliente" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  // Obter todas as assinaturas (admin)
  app.get("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      // Obter assinaturas regulares do banco de dados
      const subscriptions = await storage.getSubscriptions();
      console.log("[ANÁLISE MERCADO PAGO] Assinaturas regulares:", subscriptions.length);
      
      // Obter pagamentos do Mercado Pago que representam assinaturas
      const allPayments = await storage.getAllPayments();
      console.log("[ANÁLISE MERCADO PAGO] Total de pagamentos:", allPayments.length);
      console.log("[ANÁLISE MERCADO PAGO] Pagamentos do Mercado Pago:", 
        allPayments.filter(p => p.paymentMethod === 'mercadopago').length);
      console.log("[ANÁLISE MERCADO PAGO] Pagamentos aprovados do Mercado Pago:", 
        allPayments.filter(p => p.paymentMethod === 'mercadopago' && p.status === 'approved').length);
        
      const mercadoPagoPayments = allPayments.filter(p => 
        p.paymentMethod === 'mercadopago' && 
        p.status === 'approved' &&
        // Verificar pagamentos que não estão associados a uma assinatura existente
        !subscriptions.some(s => s.id === p.subscriptionId)
      );
      
      console.log("[ANÁLISE MERCADO PAGO] Pagamentos do Mercado Pago que serão convertidos em assinaturas:", 
        mercadoPagoPayments.length);
      
      // Converter pagamentos do Mercado Pago para o formato de assinatura
      const mercadoPagoSubscriptions = mercadoPagoPayments.map(payment => {
        // Calcular datas de início e fim baseadas na data do pagamento
        const paymentDate = new Date(payment.createdAt || new Date());
        const endDate = new Date(paymentDate);
        
        // Para pagamentos mensais, adicionar 30 dias
        endDate.setDate(paymentDate.getDate() + 30);
        
        // Determinar o tipo de plano com base no valor
        const amount = parseFloat(String(payment.amount));
        const planType = amount >= 600 ? 'annual' : 'monthly';
        
        return {
          id: payment.id,
          userId: payment.userId,
          clientId: payment.clientId,
          status: 'active',
          planType: planType,
          amount: String(payment.amount),
          currentPeriodStart: paymentDate,
          currentPeriodEnd: endDate,
          createdAt: paymentDate,
          updatedAt: paymentDate,
          cancelAt: null,
          canceledAt: null,
          paymentMethod: 'mercadopago',
          mercadoPagoId: payment.mercadoPagoId,
          metadata: payment.metadata
        };
      });
      
      // Combinar assinaturas regulares com assinaturas do Mercado Pago
      const allSubscriptions = [...subscriptions, ...mercadoPagoSubscriptions];
      
      console.log("[ANÁLISE MERCADO PAGO] Total de assinaturas enviadas para o frontend:", allSubscriptions.length);
      console.log("[ANÁLISE MERCADO PAGO] Assinaturas convertidas do Mercado Pago:", mercadoPagoSubscriptions.length);
      
      res.json(allSubscriptions);
    } catch (error) {
      console.error("Erro ao obter assinaturas:", error);
      res.status(500).json({ message: "Erro ao obter assinaturas" });
    }
  });

  // Criar ou atualizar assinatura manualmente (admin)
  app.post("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, clientId, type, active, expiresAt, notes } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "ID do usuário é obrigatório" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar usuário com os dados da assinatura
      const updatedUser = await storage.updateUser(userId, {
        subscriptionActive: active || true,
        subscriptionType: type || 'monthly',
        subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      
      // Criar registro na tabela de assinaturas para histórico
      const subscription = await storage.createSubscription({
        userId,
        clientId: clientId || user.clientId,
        status: active ? 'active' : 'inactive',
        planType: type || 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt ? new Date(expiresAt) : undefined,
        metadata: { notes, manuallyCreated: true },
      });
      
      res.status(201).json({
        message: "Assinatura criada/atualizada com sucesso",
        user: updatedUser,
        subscription
      });
    } catch (error) {
      console.error("Erro ao criar/atualizar assinatura:", error);
      res.status(500).json({ message: "Erro ao criar/atualizar assinatura" });
    }
  });

  // Obter todas as faturas (admin)
  app.get("/api/admin/invoices", isAdmin, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Erro ao obter faturas:", error);
      res.status(500).json({ message: "Erro ao obter faturas" });
    }
  });

  // ==================== STRIPE PAYMENT ROUTES ====================
  
  // Endpoint para criar uma sessão de checkout
  app.post("/api/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error("Missing Stripe Price ID");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const { planType = 'monthly' } = req.body;
      
      // Preço baseado no tipo de plano
      const priceId = process.env.STRIPE_PRICE_ID || null;
      
      if (!priceId) {
        return res.status(400).json({ error: "Invalid plan type" });
      }
      
      // Criar sessão de checkout
      const session = await stripeClient.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment-cancel`,
        subscription_data: {
          metadata: {
            userId: req.user?.id.toString(),
            planType,
          },
        },
        client_reference_id: req.user?.id.toString(),
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Erro ao criar sessão de checkout:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obter informações da assinatura do usuário
  app.get("/api/user/subscription-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("Usuário não autenticado");
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).send("Usuário não encontrado");
      }
      
      // Determinar se é um período de teste
      const isTrial = user.subscriptionType === "trial";
      const trialUsed = user.subscriptionType === "trial" || user.subscriptionExpiresAt != null;
      
      // Detalhes de pagamento do Stripe (se disponível)
      let stripePaymentMethod = null;
      if (user.stripeCustomerId) {
        try {
          const customer = await stripeClient.customers.retrieve(user.stripeCustomerId, {
            expand: ["invoice_settings.default_payment_method"],
          });
          
          if (customer && !("deleted" in customer) && customer.invoice_settings?.default_payment_method) {
            const paymentMethod = customer.invoice_settings.default_payment_method;
            if (typeof paymentMethod !== "string") {
              stripePaymentMethod = {
                brand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                expMonth: paymentMethod.card?.exp_month,
                expYear: paymentMethod.card?.exp_year,
              };
            }
          }
        } catch (err) {
          console.error("Erro ao obter detalhes do cliente no Stripe:", err);
          // Não retornar erro para o cliente, apenas continuar sem as informações de pagamento
        }
      }
      
      // Formatar informações para o cliente
      return res.json({
        active: user.subscriptionActive || false,
        isTrial,
        trialUsed,
        planType: user.subscriptionType || null,
        expiresAt: user.subscriptionExpiresAt || null,
        paymentMethod: stripePaymentMethod,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null
      });
    } catch (error: any) {
      console.error("Erro ao obter informações da assinatura:", error.message);
      return res.status(500).send({ error: error.message });
    }
  });

  // Endpoint para cancelar uma assinatura
  app.post("/api/cancel-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("Usuário não autenticado");
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).send("Usuário não encontrado");
      }
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).send("Usuário não possui assinatura ativa");
      }
      
      // Cancelar assinatura no Stripe, mas manter até o final do período já pago
      await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Atualizar registro local para refletir o cancelamento agendado
      await storage.createSubscriptionEvent({
        userId,
        eventType: 'cancellation_scheduled', 
        eventDate: new Date().toISOString(),
        planType: user.subscriptionType || 'unknown',
        details: 'Assinatura cancelada pelo usuário. Acesso permanece até o fim do período atual.'
      });
      
      res.json({ 
        success: true, 
        message: "Assinatura cancelada com sucesso. Seu acesso permanecerá ativo até o final do período atual." 
      });
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error.message);
      res.status(500).send({ error: error.message });
    }
  });

  // Endpoint para criar uma sessão do portal de clientes do Stripe
  app.post("/api/create-portal-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("Usuário não autenticado");
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).send("Usuário não encontrado");
      }
      
      if (!user.stripeCustomerId) {
        return res.status(400).send("Usuário não possui informações de pagamento");
      }
      
      // Criar sessão do portal de clientes
      const session = await stripeClient.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/subscribe`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Erro ao criar sessão do portal:", error.message);
      res.status(500).send({ error: error.message });
    }
  });

  // Webhook do Stripe para receber eventos
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing Stripe configuration");
      return res.status(500).send("Missing Stripe configuration");
    }
    
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
    
    const signature = req.headers["stripe-signature"];
    
    if (!signature) {
      return res.status(400).send("Missing Stripe signature");
    }
    
    let event;
    
    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Gerenciar eventos diferentes do Stripe
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Obter informações do usuário a partir dos metadados
        const userId = session.subscription_data?.metadata?.userId || 
                      session.client_reference_id;
                      
        if (!userId) {
          console.error("No user ID found in Stripe session");
          return res.status(400).send("No user ID found in Stripe session");
        }
        
        const planType = session.subscription_data?.metadata?.planType || 'monthly';
        const user = await storage.getUserById(parseInt(userId));
        
        if (!user) {
          console.error(`User not found: ${userId}`);
          return res.status(404).send(`User not found: ${userId}`);
        }
        
        // Calcular data de expiração com base no tipo de plano
        const now = new Date();
        let expiresAt: Date;
        
        if (planType === 'annual') {
          expiresAt = new Date(now);
          expiresAt.setFullYear(now.getFullYear() + 1);
        } else {
          expiresAt = new Date(now);
          expiresAt.setMonth(now.getMonth() + 1);
        }
        
        // Atualizar usuário
        await storage.updateUser(parseInt(userId), {
          subscriptionActive: true,
          subscriptionType: planType,
          subscriptionExpiresAt: expiresAt,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
        });
        
        // Registrar evento de assinatura
        await storage.createSubscriptionEvent({
          userId: parseInt(userId),
          eventType: 'subscription_created',
          eventDate: new Date().toISOString(),
          planType,
          details: `Assinatura ${planType} criada com sucesso. Expira em ${format(expiresAt, 'dd/MM/yyyy')}`
        });
        
        // Enviar email de confirmação
        try {
          await sendSubscriptionEmail(
            user.email,
            user.name,
            planType,
            now,
            expiresAt,
            planType === 'annual' ? 960 : 99.9
          );
        } catch (emailError) {
          console.error("Error sending subscription email:", emailError);
        }
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Processar atualização de assinatura
        const stripeCustomerId = subscription.customer as string;
        const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
        
        if (!user) {
          console.error(`User not found for Stripe customer: ${stripeCustomerId}`);
          return res.status(404).send(`User not found for Stripe customer: ${stripeCustomerId}`);
        }
        
        if (subscription.status === "active") {
          // Assinatura ativa
          await storage.updateUser(user.id, {
            subscriptionActive: true,
            stripeSubscriptionId: subscription.id,
          });
          
          // Registrar evento
          await storage.createSubscriptionEvent({
            userId: user.id,
            eventType: 'subscription_updated',
            eventDate: new Date().toISOString(),
            planType: user.subscriptionType || 'unknown',
            details: 'Assinatura atualizada e ativa'
          });
        } else if (subscription.status === "canceled") {
          // Assinatura cancelada
          await storage.updateUser(user.id, {
            subscriptionActive: false,
          });
          
          // Registrar evento
          await storage.createSubscriptionEvent({
            userId: user.id,
            eventType: 'subscription_canceled',
            eventDate: new Date().toISOString(),
            planType: user.subscriptionType || 'unknown',
            details: 'Assinatura cancelada'
          });
        }
        
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        
        const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
        
        if (!user) {
          console.error(`User not found for Stripe customer: ${stripeCustomerId}`);
          return res.status(404).send(`User not found for Stripe customer: ${stripeCustomerId}`);
        }
        
        // Atualizar data de expiração com base no tipo de plano
        const planType = user.subscriptionType || 'monthly';
        const now = new Date();
        let expiresAt: Date;
        
        if (planType === 'annual') {
          expiresAt = new Date(now);
          expiresAt.setFullYear(now.getFullYear() + 1);
        } else {
          expiresAt = new Date(now);
          expiresAt.setMonth(now.getMonth() + 1);
        }
        
        await storage.updateUser(user.id, {
          subscriptionActive: true,
          subscriptionExpiresAt: expiresAt,
        });
        
        // Registrar evento
        await storage.createSubscriptionEvent({
          userId: user.id,
          eventType: 'payment_succeeded',
          eventDate: new Date().toISOString(),
          planType,
          details: `Pagamento recebido com sucesso. Assinatura estendida até ${format(expiresAt, 'dd/MM/yyyy')}`
        });
        
        // Armazenar recibo/fatura
        await storage.createInvoice({
          userId: user.id,
          clientId: user.clientId,
          status: 'paid',
          amount: (invoice.amount_paid / 100).toString(),
          paymentMethod: 'stripe',
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          receiptUrl: invoice.hosted_invoice_url || null,
          metadata: { 
            invoiceNumber: invoice.number,
            billingReason: invoice.billing_reason,
            planType
          },
        });
        
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        
        const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
        
        if (!user) {
          console.error(`User not found for Stripe customer: ${stripeCustomerId}`);
          return res.status(404).send(`User not found for Stripe customer: ${stripeCustomerId}`);
        }
        
        // Registrar evento
        await storage.createSubscriptionEvent({
          userId: user.id,
          eventType: 'payment_failed',
          eventDate: new Date().toISOString(),
          planType: user.subscriptionType || 'unknown',
          details: 'Falha no pagamento da assinatura'
        });
        
        // Armazenar registro de falha
        await storage.createInvoice({
          userId: user.id,
          clientId: user.clientId,
          status: 'failed',
          amount: (invoice.amount_due / 100).toString(),
          paymentMethod: 'stripe',
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          metadata: { 
            invoiceNumber: invoice.number,
            billingReason: invoice.billing_reason,
            planType: user.subscriptionType,
            failureReason: invoice.last_payment_error?.message || 'Falha no pagamento'
          },
        });
        
        break;
      }
    }
    
    res.send({ received: true });
  });

  // Endpoint para redirecionamento para Mercado Pago
  app.post("/api/create-payment-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { planType = 'monthly' } = req.body;
      
      // Links diretos para os planos do Mercado Pago
      const mercadoPagoLinks = {
        monthly: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808496c606170196c6d5ebde0047",
        annual: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808496c606170196c9eaef0c0171"
      };
      
      // Retorna a URL do Mercado Pago para o frontend
      const url = mercadoPagoLinks[planType as keyof typeof mercadoPagoLinks] || mercadoPagoLinks.monthly;
      
      // Logar a ação para auditoria
      console.log(`Redirecionando usuário ${req.user?.id} para checkout do Mercado Pago (plano: ${planType})`);
      
      res.json({ url });
    } catch (error: any) {
      console.error("Erro ao processar redirecionamento para Mercado Pago:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para redirecionamento para assinatura do Mercado Pago
  app.post("/api/get-or-create-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { planType = 'monthly' } = req.body;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: { message: "Não autenticado" } });
      }
      
      // Links diretos para os planos do Mercado Pago
      const mercadoPagoLinks = {
        monthly: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808496c606170196c6d5ebde0047",
        annual: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808496c606170196c9eaef0c0171"
      };
      
      // Retorna a URL do Mercado Pago para o frontend
      const url = mercadoPagoLinks[planType as keyof typeof mercadoPagoLinks] || mercadoPagoLinks.monthly;
      
      // Logar a ação para auditoria
      console.log(`Redirecionando usuário ${user.id} para assinatura do Mercado Pago (plano: ${planType})`);
      
      res.json({ url });
    } catch (error: any) {
      console.error("Erro ao processar redirecionamento para Mercado Pago:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ADMIN FINANCE ROUTES ====================
  // Obter estatísticas financeiras (admin)
  app.get("/api/admin/finance/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      // Obter todas as assinaturas
      const subscriptions = await storage.getSubscriptions();
      
      // Obter todas as faturas
      const invoices = await storage.getInvoices();
      
      // Obter todos os pagamentos (inclusive do Mercado Pago)
      const allPayments = await storage.getAllPayments();
      
      // Estatísticas básicas
      const totalSubscriptions = subscriptions.length;
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
      const annualSubscriptions = subscriptions.filter(s => s.planType === 'annual').length;
      const monthlySubscriptions = subscriptions.filter(s => s.planType === 'monthly').length;
      
      // Calcular faturamento de faturas
      let totalRevenue = 0;
      let paidInvoices = 0;
      let failedInvoices = 0;
      
      for (const invoice of invoices) {
        if (invoice.status === 'paid') {
          totalRevenue += parseFloat(String(invoice.amount || 0));
          paidInvoices++;
        } else if (invoice.status === 'failed') {
          failedInvoices++;
        }
      }
      
      // Adicionar faturamento do Mercado Pago
      for (const payment of allPayments) {
        if (payment.status === 'approved' && payment.paymentMethod === 'mercadopago') {
          // Evitar duplicação se o pagamento já está associado a uma fatura
          if (!payment.invoiceId) {
            totalRevenue += parseFloat(String(payment.amount || 0));
          }
        }
      }
      
      // Calcular média mensal
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Calculando receita mensal das faturas regulares
      let monthlyRevenue = invoices
        .filter(invoice => 
          invoice.status === 'paid' && 
          invoice.createdAt && 
          new Date(invoice.createdAt) >= firstDayOfMonth
        )
        .reduce((sum, invoice) => sum + parseFloat(String(invoice.amount || 0)), 0);
      
      // Adicionando receita mensal dos pagamentos do Mercado Pago
      const mercadoPagoMonthlyRevenue = allPayments
        .filter(payment => 
          payment.status === 'approved' && 
          payment.paymentMethod === 'mercadopago' && 
          payment.createdAt && 
          new Date(payment.createdAt) >= firstDayOfMonth && 
          // Evitar duplicação se o pagamento já está associado a uma fatura
          !payment.invoiceId
        )
        .reduce((sum, payment) => sum + parseFloat(String(payment.amount || 0)), 0);
      
      monthlyRevenue += mercadoPagoMonthlyRevenue;
      
      // Calcular taxa de cancelamento (churn rate)
      const canceledSubscriptions = subscriptions.filter(s => s.status === 'canceled').length;
      const churnRate = totalSubscriptions > 0 
        ? (canceledSubscriptions / totalSubscriptions) * 100 
        : 0;
      
      // Gerar dados para o gráfico de receita mensal
      const currentYear = today.getFullYear();
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      
      // Inicializar array de dados mensais
      const monthlyData = monthNames.map((month, index) => ({
        month,
        revenue: 0
      }));
      
      // Calcular receita por mês das faturas
      for (const invoice of invoices) {
        if (invoice.status === 'paid' && invoice.createdAt) {
          const invoiceDate = new Date(invoice.createdAt);
          // Verificar se é do ano atual
          if (invoiceDate.getFullYear() === currentYear) {
            const monthIndex = invoiceDate.getMonth();
            monthlyData[monthIndex].revenue += parseFloat(String(invoice.amount || 0));
          }
        }
      }
      
      // Adicionar receita por mês dos pagamentos do Mercado Pago
      for (const payment of allPayments) {
        if (
          payment.status === 'approved' && 
          payment.paymentMethod === 'mercadopago' && 
          payment.createdAt && 
          // Evitar duplicação se o pagamento já está associado a uma fatura
          !payment.invoiceId
        ) {
          const paymentDate = new Date(payment.createdAt);
          if (paymentDate.getFullYear() === currentYear) {
            const monthIndex = paymentDate.getMonth();
            monthlyData[monthIndex].revenue += parseFloat(String(payment.amount || 0));
          }
        }
      }
      
      // Dados para o gráfico de assinaturas por status
      const statusCounts = {
        active: activeSubscriptions,
        canceled: canceledSubscriptions,
        past_due: subscriptions.filter(s => s.status === 'past_due').length,
        trialing: subscriptions.filter(s => s.status === 'trialing').length
      };
      
      const subscriptionsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
      
      // Formatar estatísticas para retorno
      res.json({
        totalSubscriptions,
        activeSubscriptions,
        annualSubscriptions,
        monthlySubscriptions,
        totalRevenue,
        paidInvoices,
        failedInvoices,
        monthlyRevenue,
        currency: 'BRL',
        churnRate,
        monthlyData,
        subscriptionsByStatus
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas financeiras:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas financeiras" });
    }
  });

  // Atualizar configurações financeiras (admin)
  app.post("/api/admin/finance/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      
      // Atualizar configurações financeiras
      const updatedSettings = await storage.updateFinanceSettings(settings);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Erro ao atualizar configurações financeiras:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações financeiras" });
    }
  });

  // Obter informações de pagamento de um usuário específico (admin)
  app.get("/api/admin/users/payment-info/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Obter assinaturas do usuário
      const subscriptions = await storage.getSubscriptionsByUserId(userId);
      
      // Obter faturas do usuário
      const invoices = await storage.getInvoicesByUserId(userId);
      
      // Formatar resposta
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionActive: user.subscriptionActive,
          subscriptionType: user.subscriptionType,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        },
        subscriptions,
        invoices,
      });
    } catch (error) {
      console.error("Erro ao obter informações de pagamento:", error);
      res.status(500).json({ message: "Erro ao obter informações de pagamento" });
    }
  });

  // ==================== ADMIN USER MANAGEMENT ROUTES ====================
  // Obter todos os usuários (admin)
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Erro ao obter usuários:", error);
      res.status(500).json({ message: "Erro ao obter usuários" });
    }
  });

  // Ativar/desativar acesso de usuário (admin)
  app.put("/api/admin/users/:id/toggle-access", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({ message: "O campo 'isActive' é obrigatório" });
      }
      
      const user = await storage.toggleUserAccess(userId, isActive);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({
        message: isActive ? "Acesso do usuário ativado" : "Acesso do usuário desativado",
        user
      });
    } catch (error) {
      console.error("Erro ao ativar/desativar acesso:", error);
      res.status(500).json({ message: "Erro ao ativar/desativar acesso" });
    }
  });

  // Enviar lembrete de pagamento para usuário (admin)
  app.post("/api/admin/users/:id/send-payment-reminder", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { customMessage } = req.body;
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Enviar email de lembrete
      await sendPaymentReminderEmail(user, customMessage);
      
      res.json({ message: "Lembrete de pagamento enviado com sucesso" });
    } catch (error) {
      console.error("Erro ao enviar lembrete de pagamento:", error);
      res.status(500).json({ message: "Erro ao enviar lembrete de pagamento" });
    }
  });

  // Redefinir senha de usuário (admin)
  app.post("/api/admin/users/:id/reset-password", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar senha
      const hashedPassword = await hashPassword(newPassword);
      await storage.updatePassword(userId, hashedPassword);
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Excluir usuário (admin)
  app.delete("/api/admin/users/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verificar se o usuário existe
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário não é um administrador (para evitar excluir admins)
      if (user.profileType === 'admin' || user.profileType === 'administrador') {
        return res.status(403).json({ message: "Não é permitido excluir usuários administradores" });
      }
      
      // Verificar se o ID do usuário não é o mesmo do administrador logado
      if (userId === req.user?.id) {
        return res.status(403).json({ message: "Não é permitido excluir seu próprio usuário" });
      }
      
      // Excluir usuário
      await storage.deleteUser(userId);
      
      res.json({
        message: "Usuário excluído com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Atualizar tipo de perfil de usuário (admin)
  app.put("/api/admin/users/:id/update-profile-type", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { profileType } = req.body;
      
      if (!profileType || !['admin', 'client', 'driver', 'agent', 'shipper'].includes(profileType)) {
        return res.status(400).json({ message: "Tipo de perfil inválido" });
      }
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar tipo de perfil
      const updatedUser = await storage.updateUser(userId, { profileType });
      
      res.json({
        message: "Tipo de perfil atualizado com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao atualizar tipo de perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar tipo de perfil" });
    }
  });

  // ==================== PUBLIC ROUTES ====================
  // Estatísticas públicas para a página inicial
  app.get("/api/public/stats", async (req: Request, res: Response) => {
    try {
      // Obter dados necessários
      const allDrivers = await storage.getDrivers();
      const allClients = await storage.getClients();
      const allUsers = await storage.getUsers();
      
      // Obter fretes e filtrar os ativos
      const allFreights = await storage.getFreights();
      const now = new Date();
      const activeFreights = allFreights.filter(freight => 
        new Date(freight.expirationDate) > now && freight.status === 'active'
      );
      
      // Contagem de cidades atendidas
      const citiesSet = new Set<string>();
      
      allFreights.forEach(freight => {
        citiesSet.add(freight.destination);
        
        // Considerar também destinos múltiplos se houver
        freight.destinations?.forEach(dest => {
          citiesSet.add(dest.destination);
        });
      });
      
      // Obter fretes recentes (10 mais recentes por data de criação)
      const recentFreights = [...allFreights]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      // Montar objetos com dados para o frontend  
      const stats = {
        totalFreights: allFreights.length,
        activeFreights: activeFreights.length,
        totalDrivers: allDrivers.length,
        totalCities: citiesSet.size,
        // Anos no mercado (3 conforme indicado no mock)
        yearsActive: 3,
        totalUsers: allUsers.length,
        totalClients: allClients.length,
        recentFreights: recentFreights.map(freight => ({
          id: freight.id,
          origin: freight.origin,
          originState: freight.originState,
          destination: freight.destination,
          destinationState: freight.destinationState,
          value: freight.freightValue,
          createdAt: freight.createdAt
        }))
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching public stats:", error);
      res.status(500).json({ message: "Failed to fetch public statistics" });
    }
  });
  
  // As rotas do Mercado Pago já foram configuradas no início do arquivo
  
  // Rota específica para corrigir o usuário logistica@inovaccbrasil.com.br
  app.post("/api/admin/fix-user-subscription", isAdmin, async (req: Request, res: Response) => {
    try {
      const userEmail = "logistica@inovaccbrasil.com.br";
      console.log(`Tentando corrigir assinatura para o usuário ${userEmail}`);
      
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ error: { message: "Usuário não encontrado" } });
      }
      
      console.log(`Usuário encontrado: ID: ${user.id}, Status atual: subscriptionActive=${user.subscriptionActive}, paymentRequired=${user.paymentRequired}`);
      
      // Calculando data de expiração (1 ano a partir de agora)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      // Atualizando todos os campos relevantes
      await storage.updateUser(user.id, {
        subscriptionActive: true,
        paymentRequired: false,
        subscriptionType: "yearly",
        subscriptionExpiresAt: expiresAt.toISOString()
      });
      
      // Verificando se a atualização funcionou
      const updatedUser = await storage.getUserById(user.id);
      console.log(`Status após correção: subscriptionActive=${updatedUser?.subscriptionActive}, paymentRequired=${updatedUser?.paymentRequired}`);
      
      return res.status(200).json({ 
        message: "Assinatura corrigida com sucesso", 
        user: { 
          id: user.id, 
          email: user.email,
          subscriptionActive: updatedUser?.subscriptionActive,
          paymentRequired: updatedUser?.paymentRequired,
          subscriptionExpiresAt: updatedUser?.subscriptionExpiresAt
        } 
      });
    } catch (error) {
      console.error("Erro ao corrigir assinatura:", error);
      return res.status(500).json({ error: { message: "Erro ao corrigir assinatura" } });
    }
  });
  
  // Rota especial para ativação manual de assinatura
  app.post("/api/admin/activate-subscription-manual", isAdmin, async (req: Request, res: Response) => {
    try {
      const { email, planType, amount } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: { message: "Email é obrigatório" } });
      }
      
      console.log(`Tentando ativar assinatura manual para email: ${email}`);
      
      // Primeiro verificamos se o usuário existe
      let user;
      try {
        user = await storage.getUserByEmail(email);
      } catch (e) {
        console.error("Erro ao buscar usuário:", e);
      }
      
      if (!user) {
        console.log(`Usuário não encontrado com email: ${email}`);
        return res.status(404).json({ error: { message: "Usuário não encontrado" } });
      }
      
      console.log(`Usuário encontrado: ID: ${user.id}, Nome: ${user.name}`);
      
      // Definir tipo de plano e período
      const subscriptionType = planType || "monthly";
      
      // Ativar assinatura no usuário - sem usar a data diretamente para evitar erro de conversão
      console.log(`Atualizando status de assinatura para o usuário ID: ${user.id}`);
      try {
        // Calcular data de expiração
        const now = new Date();
        const expiresAt = new Date();
        
        if (subscriptionType === "monthly") {
          expiresAt.setMonth(now.getMonth() + 1);
        } else if (subscriptionType === "yearly") {
          expiresAt.setFullYear(now.getFullYear() + 1);
        } else {
          // Para períodos de teste ou outros, adicionar 30 dias
          expiresAt.setDate(now.getDate() + 30);
        }
        
        // Garantir que todos os campos importantes sejam atualizados corretamente
        // Usando apenas os nomes de campo que correspondem ao tipo User no schema
        await storage.updateUser(user.id, {
          subscriptionActive: true,
          subscriptionType: subscriptionType,
          paymentRequired: false,
          subscriptionExpiresAt: expiresAt.toISOString()
        });
        
        // Verificar se a atualização foi bem-sucedida
        const updatedUser = await storage.getUserById(user.id);
        console.log(`Status após atualização: subscriptionActive=${updatedUser.subscriptionActive}, paymentRequired=${updatedUser.paymentRequired}`);
        
        if (!updatedUser.subscriptionActive || updatedUser.paymentRequired) {
          console.log("ALERTA: Os campos não foram atualizados corretamente. Tentando via SQL direto (apenas em último caso).");
          
          // Usar SQL direto apenas em último caso, usando a propriedade pool do storage
          const { pool } = await import('./db');
          await pool.query(
            `UPDATE users 
             SET "subscriptionActive" = true, "paymentRequired" = false 
             WHERE id = $1`,
            [user.id]
          );
        }
        
        console.log("Status de assinatura atualizado com sucesso");
      } catch (e) {
        console.error("Erro ao atualizar status de assinatura do usuário:", e);
        throw new Error("Falha ao atualizar status de assinatura");
      }
      
      // Gerar ou atualizar assinatura
      let subscriptionId;
      try {
        const now = new Date();
        const expirationDate = new Date();
        
        if (subscriptionType === "yearly") {
          expirationDate.setFullYear(now.getFullYear() + 1);
        } else {
          expirationDate.setMonth(now.getMonth() + 1);
        }
        
        // Buscar os campos exatos que o modelo espera
        const newSubscription = await storage.createSubscription({
          userId: user.id,
          status: 'active',
          planType: subscriptionType,
          clientId: user.clientId || null,
          currentPeriodStart: now,
          currentPeriodEnd: expirationDate,
          metadata: {
            amount: amount || '80.00',
            activatedManually: true,
            activatedBy: req.user?.id
          }
        });
        
        subscriptionId = newSubscription.id;
        console.log(`Nova assinatura criada com ID: ${subscriptionId}`);
      } catch (e) {
        console.error("Erro ao criar assinatura:", e);
        throw new Error("Falha ao criar registro de assinatura");
      }
      
      // Registrar fatura paga - sem usar datas para evitar erros
      let invoice;
      try {
        invoice = await storage.createInvoice({
          userId: user.id,
          status: 'paid',
          amount: amount || '80.00',
          clientId: user.clientId || null,
          subscriptionId: subscriptionId,
          description: `Assinatura ${subscriptionType === 'yearly' ? 'Anual' : 'Mensal'} - QUERO FRETES (Ativação Manual)`,
        });
        console.log(`Fatura registrada com ID: ${invoice.id}`);
      } catch (e) {
        console.error("Erro ao criar fatura:", e);
      }
      
      // Registrar evento de pagamento
      try {
        const now = new Date();
        const eventData = {
          userId: user.id,
          eventType: 'payment_success',
          planType: subscriptionType,
          eventDate: now.toISOString(), // Convertendo para formato ISO string
          details: `Ativação manual de assinatura para o usuário ${user.email}`
        };
        const event = await storage.createSubscriptionEvent(eventData);
        console.log(`Evento registrado com ID: ${event.id}`);
      } catch (e) {
        console.error("Erro ao registrar evento:", e);
      }
      
      console.log(`Ativação manual concluída com sucesso`);
      res.json({
        success: true,
        message: `Assinatura ativada com sucesso para ${user.email}`,
        details: {
          userId: user.id,
          email: user.email,
          name: user.name,
          planType: subscriptionType
        }
      });
    } catch (error: any) {
      console.error('Erro ao ativar assinatura manual:', error);
      res.status(500).json({ error: { message: error.message || 'Erro ao ativar assinatura' } });
    }
  });

  // Rota pública para visualizar um frete específico (sem autenticação)
  app.get("/api/public/freights/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const freight = await storage.getFreight(id);
      
      if (!freight) {
        return res.status(404).json({ message: "Frete não encontrado" });
      }
      
      // Verificar se o frete está ativo (não expirado)
      if (freight.status !== 'active' && freight.status !== 'aberto') {
        return res.status(403).json({ message: "Este frete não está mais disponível" });
      }
      
      res.json(freight);
    } catch (error) {
      console.error("Erro ao obter frete público:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota pública para visualizar um complemento específico (sem autenticação)
  app.get("/api/public/complements/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const complement = await storage.getComplement(id);
      
      if (!complement) {
        return res.status(404).json({ message: "Complemento não encontrado" });
      }
      
      // Verificar se o complemento está ativo
      if (complement.status !== 'active') {
        return res.status(403).json({ message: "Este complemento não está mais disponível" });
      }
      
      // Buscar informações do cliente se existir
      let client = null;
      if (complement.clientId) {
        client = await storage.getClient(complement.clientId);
      }

      res.json({
        ...complement,
        client,
        // Remover informações sensíveis para compartilhamento público
        userId: undefined
      });
    } catch (error) {
      console.error("Erro ao obter complemento público:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ==================== COMPLEMENTOS ====================
  // Obter todos complementos
  app.get("/api/complements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const complements = await storage.getComplements();
      res.json(complements);
    } catch (error) {
      console.error("Error fetching complements:", error);
      res.status(500).json({ message: "Failed to fetch complements" });
    }
  });

  // Obter complemento por ID
  app.get("/api/complements/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const complement = await storage.getComplement(id);
      
      if (!complement) {
        return res.status(404).json({ message: "Complement not found" });
      }
      
      res.json(complement);
    } catch (error) {
      console.error("Error fetching complement:", error);
      res.status(500).json({ message: "Failed to fetch complement" });
    }
  });

  // Criar novo complemento
  app.post("/api/complements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const complementData = req.body;
      
      // Validar dados obrigatórios
      if (!complementData.clientId || !complementData.weight || !complementData.volumeQuantity ||
          !complementData.volumeLength || !complementData.volumeWidth || !complementData.volumeHeight ||
          !complementData.invoiceValue || !complementData.freightValue || 
          !complementData.contactName || !complementData.contactPhone) {
        return res.status(400).json({ 
          message: "Todos os campos obrigatórios devem ser preenchidos" 
        });
      }
      
      const complement = await storage.createComplement(complementData);
      res.status(201).json(complement);
    } catch (error) {
      console.error("Error creating complement:", error);
      res.status(500).json({ message: "Failed to create complement" });
    }
  });

  // Atualizar complemento
  app.put("/api/complements/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const complementUpdate = req.body;
      
      const complement = await storage.updateComplement(id, complementUpdate);
      
      if (!complement) {
        return res.status(404).json({ message: "Complement not found" });
      }
      
      res.json(complement);
    } catch (error) {
      console.error("Error updating complement:", error);
      res.status(500).json({ message: "Failed to update complement" });
    }
  });

  // Deletar complemento
  app.delete("/api/complements/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteComplement(id);
      
      if (!success) {
        return res.status(404).json({ message: "Complement not found" });
      }
      
      res.json({ message: "Complement deleted successfully" });
    } catch (error) {
      console.error("Error deleting complement:", error);
      res.status(500).json({ message: "Failed to delete complement" });
    }
  });

  // Buscar complementos
  app.get("/api/complements/search/:query", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const query = req.params.query;
      const complements = await storage.searchComplements(query);
      res.json(complements);
    } catch (error) {
      console.error("Error searching complements:", error);
      res.status(500).json({ message: "Failed to search complements" });
    }
  });

  // ==================== ADMINISTRAÇÃO DE EMAIL ====================
  // Verificar status do serviço de email
  app.get("/api/admin/email/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const connectionTest = await testEmailConnection();
      
      res.json({
        configured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD && !!process.env.EMAIL_SERVICE,
        service: process.env.EMAIL_SERVICE || 'Ethereal',
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'Não configurado',
        connection: connectionTest
      });
    } catch (error) {
      console.error("Erro ao verificar status do email:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter variáveis de ambiente de email
  app.get("/api/admin/email/env", isAdmin, async (req: Request, res: Response) => {
    try {
      res.json({
        EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'não configurado',
        EMAIL_USER: process.env.EMAIL_USER || 'não configurado',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '****configurado****' : 'não configurado'
      });
    } catch (error) {
      console.error("Erro ao obter variáveis de ambiente:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Enviar email de teste
  app.post("/api/admin/email/test", isAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const testResult = await sendTestEmail(email);
      
      if (testResult.success) {
        res.json({ success: true, message: testResult.message });
      } else {
        res.status(400).json({ success: false, message: testResult.message });
      }
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Configurar credenciais de email
  app.post("/api/admin/email/config", isAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        service, 
        user, 
        password, 
        host, 
        port, 
        secure, 
        requireTLS, 
        connectionTimeout, 
        greetingTimeout, 
        socketTimeout 
      } = req.body;
      
      if (!user || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email e senha são obrigatórios" 
        });
      }

      // Determinar configurações baseadas no serviço ou usar customizadas
      let finalHost = host;
      let finalPort = port || "587";
      
      if (service && !host) {
        // Mapear serviços para configurações SMTP padrão
        const serviceMap: Record<string, { host: string; port: string }> = {
          gmail: { host: "smtp.gmail.com", port: "587" },
          outlook: { host: "smtp-mail.outlook.com", port: "587" }, 
          yahoo: { host: "smtp.mail.yahoo.com", port: "587" },
          hostinger: { host: "smtp.hostinger.com", port: "587" },
          sendgrid: { host: "smtp.sendgrid.net", port: "587" }
        };

        const serviceConfig = serviceMap[service];
        if (serviceConfig) {
          finalHost = serviceConfig.host;
          finalPort = serviceConfig.port;
        }
      }

      // Atualizar variáveis de ambiente principais
      process.env.EMAIL_SERVICE = finalHost || service || "smtp.gmail.com";
      process.env.EMAIL_USER = user;
      process.env.EMAIL_PASSWORD = password;
      
      // Configurações avançadas
      if (finalHost && finalHost !== process.env.EMAIL_SERVICE) {
        process.env.EMAIL_HOST = finalHost;
      }
      if (finalPort) {
        process.env.EMAIL_PORT = finalPort;
      }
      if (secure !== undefined) {
        process.env.EMAIL_SECURE = secure.toString();
      }
      if (requireTLS !== undefined) {
        process.env.EMAIL_REQUIRE_TLS = requireTLS.toString();
      }
      if (connectionTimeout) {
        process.env.EMAIL_CONNECTION_TIMEOUT = connectionTimeout;
      }
      if (greetingTimeout) {
        process.env.EMAIL_GREETING_TIMEOUT = greetingTimeout;
      }
      if (socketTimeout) {
        process.env.EMAIL_SOCKET_TIMEOUT = socketTimeout;
      }

      console.log(`Configurações de email atualizadas:`, {
        host: finalHost,
        port: finalPort,
        user: user,
        secure: secure,
        requireTLS: requireTLS
      });

      // Reinicializar o serviço de email com as novas configurações
      const { initEmailService } = await import("./email-service");
      await initEmailService();

      res.json({ 
        success: true, 
        message: "Configurações de email atualizadas com sucesso" 
      });
    } catch (error: any) {
      console.error("Erro ao atualizar configurações de email:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Erro interno do servidor" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
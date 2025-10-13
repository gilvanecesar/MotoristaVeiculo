import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { sendPasswordResetEmail, testEmailConnection, sendTestEmail } from "./email-service";
import { setupWhatsAppRoutes } from "./whatsapp-service-simple";

/**
 * Envia dados do usuário para N8N quando ele se cadastra
 * @param user Dados do usuário recém-cadastrado
 * @param profileType Tipo de perfil do usuário
 */
async function sendUserDataToN8N(user: any, profileType: string) {
  // URL do webhook N8N (configurável via variável de ambiente)
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  
  if (!N8N_WEBHOOK_URL) {
    console.log('N8N_WEBHOOK_URL não configurada. Dados não enviados para N8N.');
    return false;
  }

  try {
    const payload = {
      event: 'user_registered',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
        profileType: profileType,
        cpf: user.cpf,
        cnpj: user.cnpj,
        anttVehicle: user.anttVehicle,
        vehiclePlate: user.vehiclePlate,
        createdAt: user.createdAt
      },
      system: {
        source: 'QUERO_FRETES',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QueroFretes-System/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Dados do usuário ${user.name} (${user.email}) enviados para N8N com sucesso`);
      return true;
    } else {
      console.error(`❌ Erro ao enviar dados para N8N: ${response.status} - ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição para N8N:', error);
    return false;
  }
}


import { AITransportService } from "./ai-service";

import { 
  isAuthenticated, 
  isActive, 
  hasActiveSubscription, 
  isAdmin, 
  isAdminOrSelf, 
  hasClientAccess, 
  hasDriverAccess,
  canCreateFreight,
  canCreateDriver, 
  hasFreightAccess, 
  hasVehicleAccess,
  canEditDriver,
  canEditVehicle
} from "./middlewares";
import { 
  Driver, 
  InsertDriver, 
  FreightDestination, 
  Vehicle,
  CLIENT_TYPES
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendSubscriptionEmail, sendPaymentReminderEmail } from "./email-service";
import { format } from "date-fns";

import { setupWebhookRoutes, sendFreightWebhook } from "./webhook-service";
import { setupAIRoutes } from "./ai-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  

  
  // Configurar rotas do webhook
  setupWebhookRoutes(app);
  
  // Configurar rotas do assistente IA
  setupAIRoutes(app);
  
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
  
  // Função para limpar nome de CPF/CNPJ contaminados
  const cleanUserName = (name: string, cpf?: string, cnpj?: string): string => {
    if (!name) return name;
    
    let cleanedName = name;
    
    // Remover CPF do início do nome (padrões: "123.456.789-01 NOME" ou "12345678901 NOME")
    if (cpf) {
      const cpfClean = cpf.replace(/\D/g, '');
      const cpfFormatted = cpf;
      cleanedName = cleanedName.replace(new RegExp(`^${cpfFormatted}\\s+`, 'i'), '');
      cleanedName = cleanedName.replace(new RegExp(`^${cpfClean}\\s+`, 'i'), '');
    }
    
    // Remover CNPJ do início do nome (padrões: "12.345.678/0001-01 NOME" ou "12345678000101 NOME")
    if (cnpj) {
      const cnpjClean = cnpj.replace(/\D/g, '');
      const cnpjFormatted = cnpj;
      cleanedName = cleanedName.replace(new RegExp(`^${cnpjFormatted}\\s+`, 'i'), '');
      cleanedName = cleanedName.replace(new RegExp(`^${cnpjClean}\\s+`, 'i'), '');
    }
    
    // Remover padrões genéricos de CPF/CNPJ do início
    cleanedName = cleanedName.replace(/^\d{2}\.\d{3}\.\d{3}-\d{2}\s+/i, ''); // CPF formatado
    cleanedName = cleanedName.replace(/^\d{11}\s+/i, ''); // CPF sem formatação
    cleanedName = cleanedName.replace(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\s+/i, ''); // CNPJ formatado
    cleanedName = cleanedName.replace(/^\d{14}\s+/i, ''); // CNPJ sem formatação
    
    return cleanedName.trim();
  };

  // Cadastro por perfil (novo sistema)
  app.post("/api/auth/register-profile", async (req: Request, res: Response) => {
    try {
      const { profileType, cpf, cnpj, whatsapp, email, anttVehicle, vehiclePlate, documento, name, password, companyData, vehicleData } = req.body;

      if (!profileType || !name) {
        return res.status(400).json({ message: "Campos obrigatórios não preenchidos" });
      }
      
      // Validar senha para perfis que não são motorista
      if (profileType !== "motorista" && !password) {
        return res.status(400).json({ message: "Senha é obrigatória" });
      }

      // Validações específicas por perfil
      if (profileType === "motorista") {
        if (!cpf || !whatsapp || !anttVehicle || !vehiclePlate) {
          return res.status(400).json({ message: "Dados de motorista incompletos" });
        }
        
        // Verificar se CPF já existe
        const existingUser = await storage.getUserByCpf(cpf);
        if (existingUser) {
          return res.status(409).json({ message: "CPF_ALREADY_EXISTS" });
        }
      } else if (profileType === "embarcador") {
        if (!cnpj || !email) {
          return res.status(400).json({ message: "CNPJ e email são obrigatórios para embarcadores" });
        }
        
        // Verificar se CNPJ já existe
        const existingUser = await storage.getUserByCnpj(cnpj);
        if (existingUser) {
          return res.status(409).json({ message: "CNPJ_ALREADY_EXISTS" });
        }
      } else if (profileType === "agenciador") {
        if (!documento || !whatsapp || !email || !password) {
          return res.status(400).json({ message: "Dados de agenciador incompletos" });
        }
        
        // Verificar se documento já existe
        const existingUser = documento.length >= 14 ? 
          await storage.getUserByCnpj(documento) : 
          await storage.getUserByCpf(documento);
        if (existingUser) {
          console.log(`[REGISTRO] Tentativa de cadastro duplicado - Documento: ${documento} já pertence ao usuário ID: ${existingUser.id} (${existingUser.name} - ${existingUser.email})`);
          return res.status(400).json({ message: "Documento já cadastrado no sistema" });
        }
      }

      // Limpar nome de possíveis contaminações de CPF/CNPJ
      const cleanedName = cleanUserName(name, cpf || (documento?.length < 14 ? documento : null), cnpj || (documento?.length >= 14 ? documento : null));
      
      // Criar usuário baseado no perfil
      const userData = {
        name: cleanedName,
        email: email || null,
        password: password ? await hashPassword(password) : null,
        profileType,
        cpf: cpf || (documento?.length < 14 ? documento : null) || null,
        cnpj: cnpj || (documento?.length >= 14 ? documento : null) || null,
        whatsapp: whatsapp || null,
        anttVehicle: anttVehicle || null,
        vehiclePlate: vehiclePlate || null,
        isActive: true,
        isVerified: true, // Auto-verificar usuários registrados por perfil
        subscriptionActive: profileType === "motorista" ? true : false, // Motoristas têm acesso gratuito
        subscriptionType: profileType === "motorista" ? "free" : null
      };

      const newUser = await storage.createUser(userData);

      // Se usuário tem CNPJ, criar automaticamente registro em clients ou reutilizar existente
      let clientId = null;
      const userCnpj = cnpj || (documento?.length >= 14 ? documento : null);
      if (userCnpj) {
        try {
          // Verificar se já existe um cliente com este CNPJ
          const existingClients = await storage.getClients();
          const existingClient = existingClients.find(c => c.cnpj === userCnpj);
          
          if (existingClient) {
            // Reutilizar cliente existente
            clientId = existingClient.id;
            console.log(`[REGISTRO] Reutilizando cliente existente - ID: ${clientId} para usuário ${newUser.id} (${cleanedName})`);
          } else {
            // Criar novo cliente
            // Determinar o tipo de cliente baseado no perfil
            let clientType = "embarcador"; // default
            if (profileType === "transportador") {
              clientType = "transportador";
            } else if (profileType === "agenciador") {
              clientType = "agente";
            }

            const clientData = {
              name: cleanedName,
              cnpj: userCnpj,
              email: email || "",
              phone: whatsapp || "",
              whatsapp: whatsapp || null,
              clientType,
              contactName: req.body.contactName || null,
            };

            const newClient = await storage.createClient(clientData);
            clientId = newClient.id;
            console.log(`[REGISTRO] Cliente criado automaticamente - ID: ${clientId} para usuário ${newUser.id} (${cleanedName})`);
          }

          // Atualizar o usuário com o clientId
          await storage.updateUser(newUser.id, { clientId });
          
          // Buscar usuário atualizado para incluir o clientId na sessão
          const updatedUser = await storage.getUserById(newUser.id);
          if (updatedUser) {
            Object.assign(newUser, updatedUser);
          }
        } catch (error) {
          console.error('Erro ao criar/vincular cliente automaticamente:', error);
          // Não bloquear o registro se falhar a criação do cliente
        }
      }

      // Enviar dados para N8N quando usuário se cadastra
      try {
        await sendUserDataToN8N(newUser, profileType);
      } catch (error) {
        console.error('Erro ao enviar dados para N8N:', error);
      }

      // Para motoristas, não precisa de assinatura
      if (profileType === "motorista") {
        // Auto-login do usuário (simular login para motoristas)
        req.login(newUser, (err) => {
          if (err) {
            console.error("Erro no auto-login:", err);
            return res.status(500).json({ message: "Erro no cadastro" });
          }
          return res.json({ 
            message: "Cadastro realizado com sucesso",
            user: newUser,
            needsSubscription: false
          });
        });
      } else {
        // Para embarcadores e agenciadores, verificar se precisa de assinatura
        // Verificar se já tem assinatura ativa via OpenPix usando email ou documento
        const hasActiveSubscription = false; // Aqui integraria com verificação OpenPix
        
        // Auto-login do usuário
        req.login(newUser, (err) => {
          if (err) {
            console.error("Erro no auto-login:", err);
            return res.status(500).json({ message: "Erro no cadastro" });
          }
          return res.json({ 
            message: "Cadastro realizado com sucesso",
            user: newUser,
            needsSubscription: !hasActiveSubscription
          });
        });
      }
    } catch (error: any) {
      console.error("Erro no cadastro por perfil:", error);
      console.error("Erro detalhado:", JSON.stringify(error, null, 2));
      
      // Verificar se é erro de email duplicado
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        return res.status(400).json({ message: "Este email já está cadastrado no sistema" });
      }
      
      // Verificar se é erro de CNPJ duplicado
      if (error.code === '23505' && error.constraint === 'users_cnpj_unique') {
        return res.status(400).json({ message: "Este CNPJ já está cadastrado no sistema" });
      }
      
      // Verificar se é erro de CPF duplicado
      if (error.code === '23505' && error.constraint === 'users_cpf_unique') {
        return res.status(400).json({ message: "Este CPF já está cadastrado no sistema" });
      }
      
      // Verificar se é erro de constraint de NOT NULL
      if (error.code === '23502') {
        return res.status(400).json({ message: "Dados obrigatórios não preenchidos: " + error.column });
      }
      
      res.status(500).json({ message: "Erro interno do servidor: " + error.message });
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
  app.post("/api/drivers", canCreateDriver, async (req: Request, res: Response) => {
    try {
      const driverData: InsertDriver = {
        ...req.body
      };
      
      // Limpar nome de possíveis contaminações de CPF
      if (driverData.name && driverData.cpf) {
        driverData.name = cleanUserName(driverData.name, driverData.cpf, undefined);
      }
      
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
      
      // Limpar nome de possíveis contaminações de CPF se estiver sendo atualizado
      if (driverData.name && driverData.cpf) {
        driverData.name = cleanUserName(driverData.name, driverData.cpf, undefined);
      }
      
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
  // Obter todos veículos
  app.get("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      let vehicles: Vehicle[];
      
      // Se um ID de motorista for especificado, filtrar por esse motorista
      if (req.query.driverId) {
        const driverId = parseInt(req.query.driverId as string);
        vehicles = await storage.getVehiclesByDriver(driverId);
      } else {
        vehicles = await storage.getVehicles();
      }
      
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Obter veículo por ID
  app.get("/api/vehicles/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  // Criar novo veículo
  app.post("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const vehicleData = {
        ...req.body,
        userId: req.user?.id // Adicionar o ID do usuário que está criando o veículo
      };
      
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Atualizar veículo existente
  app.put("/api/vehicles/:id", canEditVehicle, async (req: Request, res: Response) => {
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
  app.delete("/api/vehicles/:id", canEditVehicle, async (req: Request, res: Response) => {
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
  app.post("/api/clients", isAuthenticated, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const clientData = req.body;
      
      // DEBUG: Log detalhado da sessão do usuário
      console.log(`[DEBUG] Criando cliente - req.user:`, {
        id: req.user?.id,
        email: req.user?.email,
        name: req.user?.name,
        sessionData: req.session?.passport?.user
      });
      
      // Validar campos obrigatórios
      if (!clientData.name || !clientData.cnpj || !clientData.email || !clientData.phone) {
        return res.status(400).json({ 
          message: "Campos obrigatórios não preenchidos: nome, CNPJ, email e telefone são obrigatórios." 
        });
      }
      
      // Garantir que clientType seja definido
      if (!clientData.clientType) {
        clientData.clientType = CLIENT_TYPES.SHIPPER; // Valor padrão
      }
      
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
        
        // Atualizar também o objeto req.user para refletir a mudança na sessão atual
        req.user.clientId = client.id;
        
        console.log(`Cliente ID ${client.id} associado ao usuário ID ${req.user.id}`);
      }
      
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      
      // Verificar se é erro de constraint de CNPJ duplicado
      if (error.code === '23505' && error.constraint === 'clients_cnpj_unique') {
        return res.status(400).json({ 
          message: "Este CNPJ já está cadastrado no sistema. Verifique se você já tem um cliente cadastrado ou use um CNPJ diferente." 
        });
      }
      
      // Verificar se é erro de constraint de nome duplicado  
      if (error.code === '23505' && error.constraint === 'clients_name_unique') {
        return res.status(400).json({ 
          message: "Este nome já está cadastrado no sistema. Use um nome diferente para o cliente." 
        });
      }
      
      // Erro genérico com detalhes para debug
      console.error("Detalhes do erro:", {
        code: error.code,
        constraint: error.constraint,
        detail: error.detail,
        message: error.message
      });
      
      res.status(500).json({ 
        message: "Falha ao criar cliente. Verifique os dados e tente novamente." 
      });
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
      
      // Incluir dados do usuário que criou cada frete (otimizado - uma única query)
      const userIds = [...new Set(freights.map(f => f.userId).filter(Boolean))] as number[];
      const users = await storage.getUsersByIds(userIds);
      const userMap = new Map(users.map(u => [u.id, u]));
      
      const freightsWithUser = freights.map(freight => {
        if (freight.userId && userMap.has(freight.userId)) {
          const user = userMap.get(freight.userId)!;
          return {
            ...freight,
            user: {
              id: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl
            }
          };
        }
        return freight;
      });
      
      res.json(freightsWithUser);
    } catch (error) {
      console.error("Error fetching freights:", error);
      res.status(500).json({ message: "Failed to fetch freights" });
    }
  });

  // Obter apenas os fretes do usuário logado
  app.get("/api/my-freights", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar apenas fretes criados pelo usuário atual
      const freights = await storage.getFreightsByUserId(userId);
      
      res.json(freights);
    } catch (error) {
      console.error("Error fetching user freights:", error);
      res.status(500).json({ message: "Failed to fetch user freights" });
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

  // Rastrear visualização de frete
  app.post("/api/freights/:id/track-view", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementFreightViews(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking freight view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Rastrear interesse de motorista (clique no WhatsApp)
  app.post("/api/freights/:id/track-interest", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementInterestedDrivers(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking driver interest:", error);
      res.status(500).json({ message: "Failed to track interest" });
    }
  });

  // Criar novo frete (rota principal com verificação de assinatura)
  app.post("/api/freights", isAuthenticated, canCreateFreight, async (req: Request, res: Response) => {
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
      // Obter assinaturas do banco de dados
      const subscriptions = await storage.getSubscriptions();
      
      res.json(subscriptions);
    } catch (error) {
      console.error("Erro ao obter assinaturas:", error);
      res.status(500).json({ message: "Erro ao obter assinaturas" });
    }
  });

  // Criar ou atualizar assinatura manualmente (admin)
  app.post("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        clientId, 
        clientName, 
        email, 
        plan, 
        planType, 
        amount, 
        status, 
        startDate, 
        endDate 
      } = req.body;
      
      if (!clientId && !email) {
        return res.status(400).json({ message: "ID do cliente ou email é obrigatório" });
      }
      
      // Buscar usuário pelo cliente ou email
      let user;
      if (clientId) {
        // Buscar usuário pelo clientId
        const users = await storage.getUsers();
        user = users.find(u => u.clientId === clientId);
      } else if (email) {
        // Buscar usuário pelo email
        user = await storage.getUserByEmail(email);
      }
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado para este cliente/email" });
      }
      
      // Determinar o tipo de plano
      const finalPlanType = planType || plan || 'monthly';
      const isActive = status === 'active' || status === 'trialing';
      
      // Atualizar usuário com os dados da assinatura
      const updatedUser = await storage.updateUser(user.id, {
        subscriptionActive: isActive,
        subscriptionType: finalPlanType,
        subscriptionExpiresAt: endDate ? new Date(endDate) : undefined,
      });
      
      // Criar registro na tabela de assinaturas para histórico
      const subscription = await storage.createSubscription({
        userId: user.id,
        clientId: clientId || user.clientId,
        status: isActive ? 'active' : 'inactive',
        planType: finalPlanType,
        currentPeriodStart: startDate ? new Date(startDate) : new Date(),
        currentPeriodEnd: endDate ? new Date(endDate) : undefined,
        metadata: { 
          manuallyCreated: true,
          createdBy: req.user?.id,
          amount: amount ? parseFloat(amount.toString()) : undefined
        },
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



  // Endpoint para obter informações da assinatura do usuário (apenas OpenPix)
  app.get("/api/user/subscription-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
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
      
      // Formatar informações para o cliente
      return res.json({
        active: user.subscriptionActive || false,
        isTrial,
        trialUsed,
        planType: user.subscriptionType || null,
        expiresAt: user.subscriptionExpiresAt || null,
        paymentMethod: null // Apenas OpenPix agora
      });
    } catch (error: any) {
      console.error("Erro ao obter informações da assinatura:", error.message);
      return res.status(500).send({ error: error.message });
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
      
      // Obter todos os pagamentos
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
          // Informações de pagamento removidas - apenas OpenPix agora
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
      
      console.log(`=== ENVIANDO COBRANÇA PIX PARA USUÁRIO ===`);
      console.log(`Usuário: ${user.name} (ID: ${userId})`);
      console.log(`Email: ${user.email}`);
      
      // Enviar email de lembrete com cobrança PIX da OpenPix
      const result = await sendPaymentReminderEmail(user, customMessage);
      
      if (!result.success) {
        console.error('Erro ao enviar cobrança:', result.error);
        return res.status(500).json({ 
          message: "Erro ao enviar cobrança por email",
          error: result.error 
        });
      }
      
      console.log('Email de cobrança enviado com sucesso');
      if (result.charge) {
        console.log(`Cobrança PIX criada: ${result.charge.id}`);
        console.log(`Valor: R$ ${result.charge.value}`);
      }
      
      res.json({ 
        message: "Cobrança PIX enviada com sucesso por email",
        charge: result.charge || null,
        details: {
          emailSent: true,
          pixGenerated: !!result.charge,
          value: result.charge?.value || 49.90,
          recipient: user.email
        }
      });
    } catch (error) {
      console.error("Erro ao enviar cobrança PIX:", error);
      res.status(500).json({ message: "Erro ao enviar cobrança PIX por email" });
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

  // Deletar completamente um usuário e todos os seus dados relacionados (admin)
  app.delete("/api/admin/users/:cpf/delete-all", isAdmin, async (req: Request, res: Response) => {
    try {
      const cpf = req.params.cpf;
      
      console.log(`[ADMIN] Iniciando deleção completa do usuário com CPF: ${cpf}`);
      
      // Buscar usuário pelo CPF
      const user = await storage.getUserByCpf(cpf);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log(`[ADMIN] Usuário encontrado: ${user.name} (ID: ${user.id})`);
      
      // Deletar dados relacionados em ordem
      const deletionResults: any = {
        user: user.name,
        cpf: cpf,
        deletedData: []
      };
      
      try {
        // 1. Deletar fretes do usuário
        const freights = await storage.getFreightsByUserId(user.id);
        for (const freight of freights) {
          // Deletar destinos do frete
          await storage.deleteFreightDestinations(freight.id);
          deletionResults.deletedData.push(`Destinos do frete ${freight.id}`);
        }
        
        // Deletar os fretes
        await storage.deleteFreightsByUserId(user.id);
        deletionResults.deletedData.push(`${freights.length} fretes`);
        
        // 2. Deletar veículos do usuário
        const vehicles = await storage.getVehiclesByUserId(user.id);
        await storage.deleteVehiclesByUserId(user.id);
        deletionResults.deletedData.push(`${vehicles.length} veículos`);
        
        // 3. Deletar motoristas relacionados
        const drivers = await storage.getDriversByUserId(user.id);
        await storage.deleteDriversByUserId(user.id);
        deletionResults.deletedData.push(`${drivers.length} motoristas`);
        
        // 4. Deletar clientes relacionados
        const clients = await storage.getClientsByUserId(user.id);
        await storage.deleteClientsByUserId(user.id);
        deletionResults.deletedData.push(`${clients.length} clientes`);
        
        // 5. Deletar assinaturas e pagamentos
        const subscriptions = await storage.getSubscriptionsByUser(user.id);
        await storage.deleteSubscriptionsByUserId(user.id);
        deletionResults.deletedData.push(`${subscriptions.length} assinaturas`);
        
        const payments = await storage.getPaymentsByUserId(user.id);
        await storage.deletePaymentsByUserId(user.id);
        deletionResults.deletedData.push(`${payments.length} pagamentos`);
        
        // 6. Finalmente, deletar o usuário
        await storage.deleteUser(user.id);
        deletionResults.deletedData.push('Usuário principal');
        
        console.log(`[ADMIN] Deleção completa realizada:`, deletionResults);
        
        res.json({
          message: "Usuário e todos os dados relacionados foram deletados com sucesso",
          details: deletionResults
        });
        
      } catch (deleteError) {
        console.error("Erro durante a deleção:", deleteError);
        res.status(500).json({ 
          message: "Erro durante a deleção", 
          error: deleteError instanceof Error ? deleteError.message : "Erro desconhecido",
          partialResults: deletionResults
        });
      }
      
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(500).json({ message: "Erro ao deletar usuário" });
    }
  });

  // Pesquisar usuário por ID, email, CPF ou CNPJ (admin)
  app.get("/api/admin/user-search", isAdmin, async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm) {
        return res.status(400).json({ message: "Termo de pesquisa é obrigatório" });
      }
      
      let user = null;
      
      // Tentar pesquisar por ID se o termo for um número pequeno (até 6 dígitos)
      if (/^\d{1,6}$/.test(searchTerm)) {
        const userId = parseInt(searchTerm);
        user = await storage.getUserById(userId);
      }
      
      // Se não encontrou por ID, tentar pesquisar por email
      if (!user) {
        user = await storage.getUserByEmail(searchTerm);
      }
      
      // Se não encontrou por email, tentar pesquisar por CPF
      if (!user) {
        user = await storage.getUserByCpf(searchTerm);
      }
      
      // Se não encontrou por CPF, tentar pesquisar por CNPJ
      if (!user) {
        user = await storage.getUserByCnpj(searchTerm);
      }
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Retornar dados do usuário (sem senha)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_type: user.profileType,
        phone: user.phone,
        whatsapp: user.whatsapp,
        cpf: user.cpf,
        cnpj: user.cnpj,
        antt_vehicle: user.anttVehicle,
        vehicle_plate: user.vehiclePlate,
        is_verified: user.isVerified,
        is_active: user.isActive,
        created_at: user.createdAt,
        last_login: user.lastLogin,
        subscription_active: user.subscriptionActive,
        subscription_type: user.subscriptionType,
        subscription_expires_at: user.subscriptionExpiresAt,
        payment_required: user.paymentRequired,
        driver_id: user.driverId,
        client_id: user.clientId
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error("Erro ao pesquisar usuário:", error);
      res.status(500).json({ message: "Erro ao pesquisar usuário" });
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

  // Webhook para verificação de reembolso OpenPix
  app.post('/reembolso', async (req: Request, res: Response) => {
    try {
      console.log('🎯 Webhook /reembolso atingido - dados recebidos:', JSON.stringify(req.body, null, 2));
      
      const { refund } = req.body;
      
      if (!refund) {
        console.log('❌ Webhook de reembolso sem dados de refund');
        return res.status(400).json({ error: 'Dados de reembolso não encontrados' });
      }

      const { correlationID, status, value, refundId, time } = refund;
      
      // Verificar se é um reembolso confirmado
      if (status !== 'CONFIRMED') {
        console.log(`ℹ️ Reembolso não confirmado, status: ${status}`);
        return res.json({ message: 'Reembolso não confirmado' });
      }

      console.log(`💰 Processando reembolso confirmado - correlationID: ${correlationID}, value: ${value}, refundId: ${refundId}`);

      // Buscar o pagamento pela correlationID usando SQL direto
      const { pool } = await import('./db');
      const paymentResult = await pool.query(
        `SELECT * FROM payments WHERE metadata->>'correlationID' = $1 LIMIT 1`,
        [correlationID]
      );
      
      if (paymentResult.rows.length === 0) {
        console.log(`❌ Pagamento não encontrado para correlationID: ${correlationID}`);
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }
      
      const payment = paymentResult.rows[0];

      // Buscar o usuário
      const user = await storage.getUserById(payment.user_id);
      
      if (!user) {
        console.log(`❌ Usuário não encontrado para o pagamento: ${payment.user_id}`);
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      console.log(`👤 Processando reembolso para usuário: ${user.email} (ID: ${user.id})`);

      // Atualizar o status do pagamento para reembolsado
      await storage.updatePayment(payment.id, {
        status: 'REFUNDED',
        refundedAt: new Date(),
        metadata: {
          ...payment.metadata,
          refundId,
          refundTime: time,
          refundValue: value
        }
      });

      // Cancelar a assinatura do usuário
      await storage.updateUser(user.id, {
        subscriptionActive: false,
        paymentRequired: true,
        subscriptionType: null,
        subscriptionExpiresAt: null
      });

      console.log(`✅ Reembolso processado com sucesso para ${user.email} - Assinatura cancelada`);

      // Enviar email de cancelamento
      try {
        const { sendSubscriptionCancellationEmail } = await import('./email-service');
        await sendSubscriptionCancellationEmail(
          user.email,
          user.name,
          (value / 100), // Converter centavos para reais
          new Date(time)
        );
        console.log(`📧 Email de cancelamento enviado para ${user.email}`);
      } catch (emailError) {
        console.error('Erro ao enviar email de cancelamento:', emailError);
      }

      return res.json({ 
        success: true, 
        message: 'Reembolso processado com sucesso',
        user: user.email,
        refundId,
        correlationID
      });

    } catch (error: any) {
      console.error('🚨 Erro ao processar webhook de reembolso:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      });
    }
  });

  // Rota para consultar CNPJ via ReceitaWS (evitar CORS no frontend)
  app.get('/api/validate/cnpj/:cnpj', async (req: Request, res: Response) => {
    try {
      const { cnpj } = req.params;
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      if (cleanCnpj.length !== 14) {
        return res.status(400).json({ error: 'CNPJ deve ter 14 dígitos' });
      }

      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Erro ao consultar CNPJ' });
      }

      const data = await response.json();
      
      if (data.status === 'ERROR') {
        return res.status(400).json({ error: data.message || 'CNPJ inválido' });
      }

      res.json({
        cnpj: data.cnpj,
        name: data.nome,
        fantasia: data.fantasia,
        situacao: data.situacao,
        porte: data.porte,
        endereco: {
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep
        }
      });
    } catch (error) {
      console.error('Erro ao validar CNPJ:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para consultar CPF via API (quando necessário)
  app.get('/api/validate/cpf/:cpf', async (req: Request, res: Response) => {
    try {
      const { cpf } = req.params;
      const cleanCpf = cpf.replace(/\D/g, '');
      
      if (cleanCpf.length !== 11) {
        return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
      }

      // Validação básica de CPF
      const isValidCpf = (cpf: string) => {
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit1 = 11 - (sum % 11);
        if (digit1 > 9) digit1 = 0;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        let digit2 = 11 - (sum % 11);
        if (digit2 > 9) digit2 = 0;
        
        return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
      };

      if (!isValidCpf(cleanCpf)) {
        return res.status(400).json({ error: 'CPF inválido' });
      }

      res.json({ cpf: cleanCpf, valid: true });
    } catch (error) {
      console.error('Erro ao validar CPF:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para ativar assinatura de usuário (admin)
  app.post('/api/admin/users/:userId/activate-subscription', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuário inválido' });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Ativar assinatura por 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: 'monthly',
        subscriptionExpiresAt: expiresAt,
        paymentRequired: false
      });

      console.log(`[ADMIN] Assinatura ativada para usuário ${user.email} até ${expiresAt.toISOString()}`);

      res.json({ 
        success: true, 
        message: 'Assinatura ativada com sucesso',
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Erro ao ativar assinatura:', error);
      res.status(500).json({ message: 'Erro ao ativar assinatura' });
    }
  });

  // Rota para desativar assinatura de usuário (admin)
  app.post('/api/admin/users/:userId/deactivate-subscription', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuário inválido' });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      await storage.updateUser(userId, {
        subscriptionActive: false,
        subscriptionExpiresAt: new Date(), // Expirar imediatamente
        paymentRequired: true
      });

      console.log(`[ADMIN] Assinatura desativada para usuário ${user.email}`);

      res.json({ 
        success: true, 
        message: 'Assinatura desativada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao desativar assinatura:', error);
      res.status(500).json({ message: 'Erro ao desativar assinatura' });
    }
  });

  // Rotas para configuração N8N
  app.get('/api/admin/n8n/config', isAdmin, async (req: Request, res: Response) => {
    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL || '';
      
      res.json({
        webhookUrl,
        configured: !!webhookUrl
      });
    } catch (error) {
      console.error('Erro ao buscar configuração N8N:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/n8n/config', isAdmin, async (req: Request, res: Response) => {
    try {
      const { webhookUrl } = req.body;
      
      // Aqui normalmente salvaríamos no banco ou arquivo de configuração
      // Por ora, apenas definimos a variável de ambiente temporariamente
      process.env.N8N_WEBHOOK_URL = webhookUrl;
      
      res.json({
        success: true,
        message: 'Configuração N8N salva com sucesso',
        webhookUrl
      });
    } catch (error) {
      console.error('Erro ao salvar configuração N8N:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/n8n/test', isAdmin, async (req: Request, res: Response) => {
    try {
      const { testData } = req.body;
      
      const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
      
      if (!N8N_WEBHOOK_URL) {
        return res.status(400).json({ message: 'N8N_WEBHOOK_URL não configurada' });
      }

      const payload = {
        event: 'admin_test',
        timestamp: new Date().toISOString(),
        testData,
        system: {
          source: 'QUERO_FRETES',
          environment: process.env.NODE_ENV || 'development',
          admin: req.user?.name || 'Administrador'
        }
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'QueroFretes-System/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        res.json({
          success: true,
          message: 'Teste enviado para N8N com sucesso',
          status: response.status
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Erro no teste N8N: ${response.status} - ${response.statusText}`
        });
      }
    } catch (error) {
      console.error('Erro no teste N8N:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ==================== COTAÇÕES ====================
  // Listar TODAS as cotações (incluindo públicas)
  app.get("/api/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Erro ao buscar cotações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter estatísticas de todas as cotações
  app.get("/api/quotes/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAllQuoteStats();
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar nova cotação
  app.post("/api/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quoteData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const quote = await storage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      console.error("Erro ao criar cotação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar status da cotação
  app.patch("/api/quotes/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }
      
      const quote = await storage.updateQuoteStatus(id, status, req.user!.id);
      
      if (!quote) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar cotação pública (sem autenticação)
  app.post("/api/quotes/public", async (req: Request, res: Response) => {
    try {
      const {
        clientName,
        clientEmail,
        clientPhone,
        origin,
        destination,
        cargoType,
        weight,
        volume,
        urgency,
        deliveryDate,
        price,
        observations,
        status = 'pendente'
      } = req.body;

      // Validar campos obrigatórios
      if (!clientName || !clientEmail || !clientPhone || !origin || 
          !destination || !cargoType || !weight || !volume || 
          !urgency || !deliveryDate || !price) {
        return res.status(400).json({ 
          message: "Todos os campos obrigatórios devem ser preenchidos" 
        });
      }

      // Extrair cidade e estado do formato "Cidade - Estado"
      const parseLocation = (location: string) => {
        const parts = location.split(' - ');
        if (parts.length === 2) {
          return { city: parts[0].trim(), state: parts[1].trim() };
        }
        return { city: location, state: '' };
      };

      const originParsed = parseLocation(origin);
      const destinationParsed = parseLocation(destination);

      // Criar cotação pública (sem userId)
      const quoteData = {
        clientName,
        clientEmail,
        clientPhone,
        origin: originParsed.city,
        originState: originParsed.state,
        destination: destinationParsed.city,
        destinationState: destinationParsed.state,
        cargoType,
        weight: parseFloat(weight),
        volume: parseFloat(volume),
        urgency,
        deliveryDate: new Date(deliveryDate),
        price: parseFloat(price),
        observations: observations || '',
        status,
        userId: null, // Cotação pública não tem usuário associado
        transportType: 'carga', // Valor padrão para cotações públicas
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const quote = await storage.createQuote(quoteData);
      
      // Log da cotação pública criada
      console.log(`✅ Cotação pública criada: ${clientName} (${clientEmail}) - ${originParsed.city}/${originParsed.state} → ${destinationParsed.city}/${destinationParsed.state}`);
      
      res.status(201).json({
        message: "Cotação enviada com sucesso",
        quote: {
          id: quote.id,
          clientName: quote.clientName,
          status: quote.status,
          createdAt: quote.createdAt
        }
      });
    } catch (error) {
      console.error("Erro ao criar cotação pública:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ==================== BUSCA DE CIDADES BRASILEIRAS ====================
  // Buscar cidades brasileiras na API do IBGE
  app.get("/api/cities", async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      
      if (!search || typeof search !== 'string') {
        return res.status(400).json({ message: "Parâmetro de busca é obrigatório" });
      }

      const searchTerm = search.trim();
      
      if (searchTerm.length < 2) {
        return res.status(400).json({ message: "Termo de busca deve ter pelo menos 2 caracteres" });
      }

      console.log(`🔍 Buscando cidades: "${searchTerm}"`);

      // Buscar cidades na API do IBGE
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios`);
      
      if (!response.ok) {
        throw new Error(`Erro na API do IBGE: ${response.status}`);
      }

      const cities = await response.json();

      // Filtrar cidades que começam com o termo de busca
      const filteredCities = cities
        .filter((city: any) => 
          city.nome.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 50) // Limitar a 50 resultados para performance
        .map((city: any) => ({
          id: city.id,
          name: city.nome,
          state: city.microrregiao.mesorregiao.UF.sigla,
          fullName: `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`,
          region: city.microrregiao.mesorregiao.UF.regiao.nome
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      console.log(`✅ Encontradas ${filteredCities.length} cidades para "${searchTerm}"`);

      res.json({
        cities: filteredCities,
        total: filteredCities.length
      });
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ==================== ADMIN QUOTES MANAGEMENT ROUTES ====================
  // Obter todas as cotações (admin)
  app.get("/api/admin/quotes", isAdmin, async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Erro ao obter cotações:", error);
      res.status(500).json({ message: "Erro ao obter cotações" });
    }
  });

  // Atualizar cotação específica (admin)
  app.put("/api/admin/quotes/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      const quoteData = req.body;
      
      if (!quoteId || isNaN(quoteId)) {
        return res.status(400).json({ message: "ID da cotação inválido" });
      }
      
      // Verificar se a cotação existe
      const existingQuote = await storage.getQuoteById(quoteId);
      if (!existingQuote) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      // Atualizar a cotação
      const updatedQuote = await storage.updateQuote(quoteId, quoteData);
      
      res.json({
        message: "Cotação atualizada com sucesso",
        quote: updatedQuote
      });
    } catch (error) {
      console.error("Erro ao atualizar cotação:", error);
      res.status(500).json({ message: "Erro ao atualizar cotação" });
    }
  });

  // Deletar cotação específica (admin)
  app.delete("/api/admin/quotes/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      if (!quoteId || isNaN(quoteId)) {
        return res.status(400).json({ message: "ID da cotação inválido" });
      }
      
      // Verificar se a cotação existe
      const existingQuote = await storage.getQuoteById(quoteId);
      if (!existingQuote) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      // Deletar a cotação
      await storage.deleteQuote(quoteId);
      
      res.json({
        message: "Cotação deletada com sucesso",
        deletedQuoteId: quoteId
      });
    } catch (error) {
      console.error("Erro ao deletar cotação:", error);
      res.status(500).json({ message: "Erro ao deletar cotação" });
    }
  });

  // Obter estatísticas de cotações (admin) - DEVE vir antes da rota /:id
  app.get("/api/admin/quotes/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getAllQuotes();
      
      // Calcular estatísticas
      const totalQuotes = quotes.length;
      const publicQuotes = quotes.filter(q => q.userId === null).length;
      const registeredQuotes = quotes.filter(q => q.userId !== null).length;
      const activeQuotes = quotes.filter(q => q.status === 'ativa' || q.status === 'pendente').length;
      const closedQuotes = quotes.filter(q => q.status === 'fechada').length;
      const canceledQuotes = quotes.filter(q => q.status === 'cancelada').length;
      const expiredQuotes = quotes.filter(q => q.status === 'expirada').length;
      
      // Calcular cotações por período
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const thisMonthQuotes = quotes.filter(q => new Date(q.createdAt) >= thisMonth).length;
      const lastMonthQuotes = quotes.filter(q => {
        const createdAt = new Date(q.createdAt);
        return createdAt >= lastMonth && createdAt < thisMonth;
      }).length;
      const thisWeekQuotes = quotes.filter(q => new Date(q.createdAt) >= thisWeek).length;
      
      res.json({
        totalQuotes,
        publicQuotes,
        registeredQuotes,
        activeQuotes,
        closedQuotes,
        canceledQuotes,
        expiredQuotes,
        thisMonthQuotes,
        lastMonthQuotes,
        thisWeekQuotes
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas de cotações:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas de cotações" });
    }
  });

  // Obter cotação específica (admin)
  app.get("/api/admin/quotes/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      if (!quoteId || isNaN(quoteId)) {
        return res.status(400).json({ message: "ID da cotação inválido" });
      }
      
      const quote = await storage.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Erro ao obter cotação:", error);
      res.status(500).json({ message: "Erro ao obter cotação" });
    }
  });

  // Rota de teste para verificar conexão com banco de dados
  app.get("/api/test/db", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json({ 
        message: "Banco de dados funcionando!", 
        totalUsers: users.length,
        firstUser: users[0] ? { id: users[0].id, email: users[0].email, name: users[0].name } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Erro no banco de dados", error: error.message });
    }
  });

  // ===============================
  // IBGE API INTEGRATION
  // ===============================

  // Buscar cidades do IBGE
  app.get("/api/ibge/cities", async (req: Request, res: Response) => {
    try {
      const { search, limit = 20 } = req.query;
      
      if (!search || typeof search !== 'string') {
        return res.status(400).json({ error: 'Parâmetro de busca é obrigatório' });
      }

      const searchTerm = search.trim();
      
      if (searchTerm.length < 2) {
        return res.status(400).json({ error: 'Termo de busca deve ter pelo menos 2 caracteres' });
      }

      console.log(`🔍 NOVA BUSCA: "${searchTerm}"`);

      // Buscar todas as cidades do IBGE
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
      
      if (!response.ok) {
        throw new Error('Erro ao conectar com API do IBGE');
      }
      
      const allCities = await response.json();
      console.log(`📊 Total de cidades carregadas: ${allCities.length}`);
      
      // Função para remover acentos e normalizar texto
      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
      };
      
      const searchNormalized = normalizeText(searchTerm);
      
      // Filtrar cidades que contenham o termo de busca
      const matchingCities = allCities.filter((city: any) => {
        if (!city.nome || !city.microrregiao?.mesorregiao?.UF?.sigla) {
          return false;
        }
        
        const cityNameNormalized = normalizeText(city.nome);
        return cityNameNormalized.includes(searchNormalized);
      });
      
      console.log(`🎯 Cidades encontradas: ${matchingCities.length}`);
      
      // Ordenar por prioridade: exatos primeiro, depois que começam, depois que contêm
      const sortedCities = matchingCities.sort((a: any, b: any) => {
        const aNameNormalized = normalizeText(a.nome);
        const bNameNormalized = normalizeText(b.nome);
        
        // Prioridade 1: Nome exato
        const aExact = aNameNormalized === searchNormalized;
        const bExact = bNameNormalized === searchNormalized;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Prioridade 2: Começa com o termo
        const aStarts = aNameNormalized.startsWith(searchNormalized);
        const bStarts = bNameNormalized.startsWith(searchNormalized);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Prioridade 3: Ordem alfabética
        return a.nome.localeCompare(b.nome);
      });
      
      // Formatar e limitar resultados
      const results = sortedCities
        .slice(0, parseInt(limit.toString()))
        .map((city: any) => ({
          id: city.id,
          name: city.nome,
          state: city.microrregiao.mesorregiao.UF.sigla,
          displayName: `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
        }));

      console.log(`✅ Enviando ${results.length} resultados: ${results.map(c => c.name).slice(0, 3).join(', ')}${results.length > 3 ? '...' : ''}`);
      
      res.json(results);
    } catch (error) {
      console.error('Erro na busca de cidades:', error);
      
      // Fallback para casos de erro
      const fallbackResults = [
        { id: 3550308, name: "São Paulo", state: "SP", displayName: "São Paulo - SP" },
        { id: 3304557, name: "Rio de Janeiro", state: "RJ", displayName: "Rio de Janeiro - RJ" },
        { id: 3106200, name: "Belo Horizonte", state: "MG", displayName: "Belo Horizonte - MG" },
        { id: 3136702, name: "Contagem", state: "MG", displayName: "Contagem - MG" },
        { id: 4106902, name: "Curitiba", state: "PR", displayName: "Curitiba - PR" }
      ].filter(city => {
        const searchParam = req.query.search;
        if (!searchParam || typeof searchParam !== 'string') return true;
        return city.name.toLowerCase().includes(searchParam.toLowerCase());
      });
      
      res.json(fallbackResults);
    }
  });

  // Calcular distância entre duas cidades
  app.post("/api/ibge/distance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { origin, destination } = req.body;
      
      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origem e destino são obrigatórios' });
      }

      // Calcular distância estimada baseada em coordenadas aproximadas
      const distance = await calculateDistanceBetweenCities(origin, destination);
      
      res.json({ distance, route: `${origin} → ${destination}` });
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      res.status(500).json({ error: 'Erro ao calcular distância' });
    }
  });

  // ===============================
  // CALCULADORA ANTT
  // ===============================

  // Calcular frete ANTT (com cidades)
  app.post("/api/antt/calculate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { cargoType, axles, originCity, destinationCity, transportCategory, isComposition, emptyReturn } = req.body;

      // Validar dados obrigatórios
      if (!cargoType || !axles || !originCity || !destinationCity) {
        return res.status(400).json({ 
          error: "Dados obrigatórios: cargoType, axles, originCity, destinationCity" 
        });
      }

      const numAxles = parseInt(axles);

      if (isNaN(numAxles) || numAxles < 2 || numAxles > 9) {
        return res.status(400).json({ error: "Número de eixos deve ser entre 2 e 9" });
      }

      // Calcular distância entre as cidades
      const distance = await calculateDistanceBetweenCities(originCity, destinationCity);
      
      if (distance <= 0) {
        return res.status(400).json({ error: "Não foi possível calcular a distância entre as cidades" });
      }

      // Chamar serviço de cálculo ANTT
      const result = await calculateAnttFreight({
        cargoType,
        axles: numAxles,
        distance,
        origin: originCity,
        destination: destinationCity,
        transportCategory: transportCategory || 'CARGA_LOTACAO',
        isComposition: !!isComposition,
        emptyReturn: !!emptyReturn
      });

      res.json(result);
    } catch (error) {
      console.error("Erro ao calcular frete ANTT:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Calcular frete ANTT (com distância direta)
  app.post("/api/antt/calculate-direct", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { cargoType, axles, distance, transportCategory } = req.body;

      // Validar dados obrigatórios
      if (!cargoType || !axles || !distance) {
        return res.status(400).json({ 
          error: "Dados obrigatórios: cargoType, axles, distance" 
        });
      }

      const numAxles = parseInt(axles);
      const numDistance = parseFloat(distance);

      if (isNaN(numAxles) || numAxles < 2 || numAxles > 9) {
        return res.status(400).json({ error: "Número de eixos deve ser entre 2 e 9" });
      }

      if (isNaN(numDistance) || numDistance <= 0) {
        return res.status(400).json({ error: "Distância deve ser um número maior que 0" });
      }

      // Chamar serviço de cálculo ANTT
      const result = await calculateAnttFreight({
        cargoType,
        axles: numAxles,
        distance: numDistance,
        origin: "Manual",
        destination: "Manual",
        transportCategory: transportCategory || 'CARGA_LOTACAO',
        isComposition: false,
        emptyReturn: false
      });

      res.json(result);
    } catch (error) {
      console.error("Erro ao calcular frete ANTT direto:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar dados de pedágio para uma rota
  app.post("/api/antt/toll-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { origin, destination, axles } = req.body;

      if (!origin || !destination || !axles) {
        return res.status(400).json({ 
          error: "Dados obrigatórios: origin, destination, axles" 
        });
      }

      const tollInfo = await calculateTollCosts(origin, destination, parseInt(axles));
      res.json(tollInfo);
    } catch (error) {
      console.error("Erro ao buscar informações de pedágio:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Configurar rotas do WhatsApp
  setupWhatsAppRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}

// ===============================
// SERVIÇOS ANTT
// ===============================

interface AnttCalculationParams {
  cargoType: string;
  axles: number;
  distance: number;
  origin: string;
  destination: string;
  transportCategory: string;
  isComposition: boolean;
  emptyReturn: boolean;
}

interface AnttCalculationResult {
  freightValue: number;
  tollValue: number;
  totalValue: number;
  distance: number;
  route: string;
  calculation: {
    baseRate: number;
    loadUnloadCoefficient: number;
    distanceCoefficient: number;
    adjustments: any[];
  };
}

/**
 * Calcula o frete mínimo conforme tabela ANTT oficial
 * Coeficientes extraídos da RESOLUÇÃO Nº 6.067, DE 17 DE JULHO DE 2025
 * Tabela A - Transporte Rodoviário de Carga Lotação - Carga Geral
 */
async function calculateAnttFreight(params: AnttCalculationParams): Promise<AnttCalculationResult> {
  try {
    // CCD - Custo de Deslocamento (R$/km) - RESOLUÇÃO 6.067/2025 - Tabela A - Carga Geral
    const baseRates = {
      2: 3.6735,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025
      3: 4.6502,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025
      4: 5.3306,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025
      5: 6.0112,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025
      6: 6.7301,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025
      7: 7.3085,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025
      8: 8.2680,   // Valor oficial ANTT RESOLUÇÃO 6.067/2025 (não listado, usando estimativa)
      9: 8.2680    // Valor oficial ANTT RESOLUÇÃO 6.067/2025
    };

    // Coeficientes por tabela ANTT conforme RESOLUÇÃO 6.067/2025
    const getCoefficientsForTable = (table: string, cargoType: string, axles: number) => {
      const coefficientsTable = {
        // Tabela A - Transporte Rodoviário de Carga Lotação
        'A': {
          'CARGA_GERAL': {
            CCD: { 2: 3.6735, 3: 4.6502, 4: 5.3306, 5: 6.0112, 6: 6.7301, 7: 7.3085, 9: 8.2680 },
            CC: { 2: 417.95, 3: 509.43, 4: 559.08, 5: 610.08, 6: 660.12, 7: 752.64, 9: 815.30 }
          },
          'GRANEL_SOLIDO': {
            CCD: { 2: 3.7050, 3: 4.6875, 4: 5.3526, 5: 6.0301, 6: 6.7408, 7: 7.3130, 9: 8.2420 },
            CC: { 2: 426.61, 3: 519.67, 4: 565.14, 5: 615.26, 6: 663.07, 7: 753.88, 9: 808.17 }
          },
          'GRANEL_LIQUIDO': {
            CCD: { 2: 3.7622, 3: 4.7615, 4: 5.5685, 5: 6.1801, 6: 6.8811, 7: 7.4723, 9: 8.4114 },
            CC: { 2: 433.79, 3: 531.46, 4: 607.41, 5: 639.41, 6: 684.54, 7: 780.59, 9: 837.65 }
          },
          'FRIGORIFICADA': {
            CCD: { 2: 4.3393, 3: 5.4569, 4: 6.3427, 5: 7.1099, 6: 7.8970, 7: 8.7884, 9: 9.8648 },
            CC: { 2: 486.21, 3: 582.22, 4: 662.76, 5: 713.06, 6: 754.06, 7: 932.67, 9: 993.46 }
          },
          'CONTEINERIZADA': {
            CCD: { 3: 4.7626, 4: 5.2867, 5: 5.9579, 6: 6.6621, 7: 7.3528, 9: 8.1922 },
            CC: { 3: 540.34, 4: 547.03, 5: 595.41, 6: 641.42, 7: 764.84, 9: 794.47 }
          },
          'NEOGRANEL': {
            CCD: { 2: 3.3436, 3: 4.6495, 4: 5.3428, 5: 6.0021, 6: 6.7230, 7: 7.3493, 9: 8.2608 },
            CC: { 2: 417.95, 3: 509.23, 4: 562.44, 5: 607.56, 6: 658.16, 7: 763.86, 9: 813.33 }
          }
        }
      };

      const tableData = coefficientsTable[table as keyof typeof coefficientsTable];
      if (!tableData) return null;

      const cargoData = tableData[cargoType as keyof typeof tableData];
      if (!cargoData) return tableData['CARGA_GERAL']; // Fallback para carga geral

      return {
        CCD: cargoData.CCD[axles as keyof typeof cargoData.CCD] || cargoData.CCD[5], // Fallback para 5 eixos
        CC: cargoData.CC[axles as keyof typeof cargoData.CC] || cargoData.CC[5]      // Fallback para 5 eixos
      };
    };

    // Determinar tabela baseada na categoria de transporte
    const tableMap = {
      'CARGA_LOTACAO': 'A',
      'VEICULO_AUTOMOTOR': 'B', 
      'ALTO_DESEMPENHO': 'C',
      'VEICULO_ALTO_DESEMPENHO': 'D'
    };

    const table = tableMap[params.transportCategory as keyof typeof tableMap] || 'A';
    const coefficients = getCoefficientsForTable(table, params.cargoType, params.axles);

    if (!coefficients) {
      throw new Error('Coeficientes não encontrados para os parâmetros informados');
    }

    const baseRate = coefficients.CCD;
    const loadUnloadCoeff = coefficients.CC;

    // Cálculo base: (Distância × CCD) + CC
    let freightValue = (params.distance * baseRate) + loadUnloadCoeff;

    // Ajustes
    const adjustments = [];

    if (params.isComposition) {
      freightValue *= 1.05; // 5% adicional para composição veicular
      adjustments.push({ type: 'Composição Veicular', factor: 1.05 });
    }

    if (params.isHighPerformance) {
      freightValue *= 1.08; // 8% adicional para alto desempenho
      adjustments.push({ type: 'Alto Desempenho', factor: 1.08 });
    }

    if (params.emptyReturn) {
      freightValue *= 0.85; // 15% desconto para retorno vazio
      adjustments.push({ type: 'Retorno Vazio', factor: 0.85 });
    }

    const result: AnttCalculationResult = {
      freightValue: Math.round(freightValue * 100) / 100,
      tollValue: 0, // Pedágio removido conforme solicitado
      totalValue: Math.round(freightValue * 100) / 100,
      distance: params.distance,
      route: `${params.origin} → ${params.destination}`,
      calculation: {
        baseRate,
        loadUnloadCoefficient: loadUnloadCoeff,
        distanceCoefficient: baseRate,
        adjustments,
        table: table,
        cargoType: params.cargoType
      }
    };

    return result;
  } catch (error) {
    console.error('Erro no cálculo ANTT:', error);
    throw new Error('Erro ao calcular frete ANTT');
  }
}

/**
 * Calcula custos de pedágios para uma rota
 */
async function calculateTollCosts(origin: string, destination: string, axles: number): Promise<{ totalCost: number; tollPlazas: any[] }> {
  try {
    // Base de dados simplificada de principais rotas de pedágio
    const tollRoutes: { [key: string]: any } = {
      // Fernão Dias (BR-381): BH/Betim para SP/Guarulhos
      'betim-guarulhos': {
        plazas: 8,
        costPerAxle: 5.80,
        route: 'BR-381 (Fernão Dias)',
        plazaNames: ['Itatiaiuçu', 'Carmópolis', 'Santo Antônio', 'Carmo da Cachoeira', 'São Gonçalo', 'Cambuí', 'Vargem', 'Mairiporã']
      },
      'belo horizonte-sao paulo': {
        plazas: 8,
        costPerAxle: 5.80,
        route: 'BR-381 (Fernão Dias)',
        plazaNames: ['Itatiaiuçu', 'Carmópolis', 'Santo Antônio', 'Carmo da Cachoeira', 'São Gonçalo', 'Cambuí', 'Vargem', 'Mairiporã']
      },
      'guarulhos-betim': {
        plazas: 8,
        costPerAxle: 5.80,
        route: 'BR-381 (Fernão Dias)',
        plazaNames: ['Mairiporã', 'Vargem', 'Cambuí', 'São Gonçalo', 'Carmo da Cachoeira', 'Santo Antônio', 'Carmópolis', 'Itatiaiuçu']
      },
      // Presidente Dutra (BR-116): SP para RJ
      'sao paulo-rio de janeiro': {
        plazas: 6,
        costPerAxle: 6.20,
        route: 'BR-116 (Presidente Dutra)',
        plazaNames: ['Jacareí', 'Santa Isabel', 'Arujá', 'Itatiaia', 'Seropédica', 'Rio']
      },
      'rio de janeiro-sao paulo': {
        plazas: 6,
        costPerAxle: 6.20,
        route: 'BR-116 (Presidente Dutra)',
        plazaNames: ['Rio', 'Seropédica', 'Itatiaia', 'Arujá', 'Santa Isabel', 'Jacareí']
      },
      // Outras rotas principais
      'sao paulo-curitiba': {
        plazas: 4,
        costPerAxle: 5.50,
        route: 'BR-116',
        plazaNames: ['Registro', 'Miracatu', 'Campina Grande do Sul', 'Curitiba']
      },
      'curitiba-sao paulo': {
        plazas: 4,
        costPerAxle: 5.50,
        route: 'BR-116',
        plazaNames: ['Curitiba', 'Campina Grande do Sul', 'Miracatu', 'Registro']
      }
    };

    // Normalizar nomes das cidades para busca
    const normalizedOrigin = origin.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    const normalizedDestination = destination.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    const normalizedRoute = `${normalizedOrigin}-${normalizedDestination}`;
    
    // Buscar rota na base de dados
    let routeData = tollRoutes[normalizedRoute];
    
    // Se não encontrar rota exata, tentar algumas variações comuns
    if (!routeData) {
      const variations = [
        normalizedRoute.replace('sao-paulo', 'sp').replace('rio-de-janeiro', 'rj'),
        normalizedRoute.replace('belo-horizonte', 'betim'),
        normalizedRoute.replace('sp', 'sao-paulo').replace('rj', 'rio-de-janeiro'),
        normalizedRoute.replace('betim', 'belo-horizonte')
      ];
      
      for (const variation of variations) {
        if (tollRoutes[variation]) {
          routeData = tollRoutes[variation];
          break;
        }
      }
    }
      
    // Se ainda não encontrar, usar estimativa padrão baseada na distância
    if (!routeData) {
      routeData = {
        plazas: Math.max(1, Math.floor(Math.random() * 3) + 2), // 2-4 praças estimadas
        costPerAxle: 5.80, // Valor médio
        route: 'Rota Estimada',
        plazaNames: ['Pedágio 1', 'Pedágio 2']
      };
    }

    // Calcular custo total baseado no número de eixos
    // Para caminhões, cobrança é por eixo ou categoria
    let axleMultiplier = 1;
    if (axles <= 2) axleMultiplier = 1;
    else if (axles === 3) axleMultiplier = 1;
    else if (axles === 4) axleMultiplier = 1.5;
    else if (axles === 5) axleMultiplier = 2;
    else if (axles >= 6) axleMultiplier = 2.5;

    const totalCost = Math.round(routeData.plazas * routeData.costPerAxle * axleMultiplier * 100) / 100;

    return {
      totalCost,
      tollPlazas: [{
        route: routeData.route,
        plazas: routeData.plazas,
        costPerPlaza: Math.round(routeData.costPerAxle * axleMultiplier * 100) / 100,
        plazaNames: routeData.plazaNames
      }]
    };
  } catch (error) {
    console.error('Erro ao calcular pedágios:', error);
    // Retornar estimativa mínima em caso de erro
    return {
      totalCost: 0,
      tollPlazas: []
    };
  }
}

/**
 * Busca coordenadas de uma cidade via API do IBGE
 */
async function fetchCityCoordinatesFromIBGE(cityName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Primeiro buscar a cidade para obter o ID
    const searchResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(cityName)}`);
    if (!searchResponse.ok) return null;
    
    const cities = await searchResponse.json();
    if (!cities || cities.length === 0) return null;
    
    // Pegar a primeira cidade encontrada
    const city = cities[0];
    const cityId = city.id;
    
    // Buscar coordenadas via API de distritos (mais precisa)
    const coordsResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cityId}/distritos`);
    if (!coordsResponse.ok) return null;
    
    const districts = await coordsResponse.json();
    if (!districts || districts.length === 0) return null;
    
    // Usar coordenadas do primeiro distrito (sede municipal)
    const mainDistrict = districts[0];
    if (mainDistrict && mainDistrict.coordenadas) {
      return {
        lat: parseFloat(mainDistrict.coordenadas.latitude),
        lng: parseFloat(mainDistrict.coordenadas.longitude)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar coordenadas no IBGE:', error);
    return null;
  }
}

/**
 * Calcula distância aproximada entre duas cidades brasileiras
 */
async function calculateDistanceBetweenCities(originCity: string, destinationCity: string): Promise<number> {
  try {
    // Base de dados de distâncias entre principais cidades brasileiras
    const cityDistances: { [key: string]: number } = {
      // Rotas de/para Betim-MG
      'betim-mg_guarulhos-sp': 580,
      'guarulhos-sp_betim-mg': 580,
      'betim-mg_sao-paulo-sp': 586,
      'sao-paulo-sp_betim-mg': 586,
      'betim-mg_rio-de-janeiro-rj': 434,
      'rio-de-janeiro-rj_betim-mg': 434,
      'betim-mg_curitiba-pr': 1010,
      'curitiba-pr_betim-mg': 1010,
      'betim-mg_brasilia-df': 741,
      'brasilia-df_betim-mg': 741,
      
      // Rotas de/para São Paulo-SP
      'sao-paulo-sp_rio-de-janeiro-rj': 429,
      'rio-de-janeiro-rj_sao-paulo-sp': 429,
      'sao-paulo-sp_curitiba-pr': 408,
      'curitiba-pr_sao-paulo-sp': 408,
      'sao-paulo-sp_porto-alegre-rs': 1109,
      'porto-alegre-rs_sao-paulo-sp': 1109,
      'sao-paulo-sp_salvador-ba': 1962,
      'salvador-ba_sao-paulo-sp': 1962,
      'sao-paulo-sp_brasilia-df': 1015,
      'brasilia-df_sao-paulo-sp': 1015,
      
      // Rotas de/para Rio de Janeiro-RJ
      'rio-de-janeiro-rj_curitiba-pr': 852,
      'curitiba-pr_rio-de-janeiro-rj': 852,
      'rio-de-janeiro-rj_salvador-ba': 1649,
      'salvador-ba_rio-de-janeiro-rj': 1649,
      'rio-de-janeiro-rj_brasilia-df': 1148,
      'brasilia-df_rio-de-janeiro-rj': 1148,
      
      // Outras rotas importantes
      'curitiba-pr_porto-alegre-rs': 711,
      'porto-alegre-rs_curitiba-pr': 711,
      'brasilia-df_salvador-ba': 1446,
      'salvador-ba_brasilia-df': 1446,
      'brasilia-df_fortaleza-ce': 2415,
      'fortaleza-ce_brasilia-df': 2415,
      'sao-paulo-sp_fortaleza-ce': 3154,
      'fortaleza-ce_sao-paulo-sp': 3154
    };

    // Normalizar nomes das cidades
    const normalizeCity = (city: string) => {
      // Se a cidade vem no formato "Cidade - Estado", processar corretamente
      let normalizedCity = city.toLowerCase();
      
      // Substituir " - " por "-" para converter "Betim - MG" em "betim-mg"
      normalizedCity = normalizedCity.replace(/\s+-\s+/g, '-');
      
      // Normalizar caracteres especiais
      normalizedCity = normalizedCity
        .replace(/\s+/g, '-')
        .replace(/[àáâãä]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z-]/g, '');
        
      return normalizedCity;
    };

    const normalizedOrigin = normalizeCity(originCity);
    const normalizedDestination = normalizeCity(destinationCity);
    const routeKey = `${normalizedOrigin}_${normalizedDestination}`;
    
    console.log(`[DEBUG] Calculando distância:`);
    console.log(`  Origem: "${originCity}" → "${normalizedOrigin}"`); 
    console.log(`  Destino: "${destinationCity}" → "${normalizedDestination}"`);
    console.log(`  Chave da rota: "${routeKey}"`);

    // Buscar distância na base de dados
    let distance = cityDistances[routeKey];
    
    if (!distance) {
      // Tentar rota inversa
      const reverseRouteKey = `${normalizedDestination}_${normalizedOrigin}`;
      distance = cityDistances[reverseRouteKey];
      console.log(`  Tentando rota inversa: "${reverseRouteKey}"`);
    }
    
    if (distance) {
      console.log(`  ✅ Distância encontrada na base: ${distance}km`);
    } else {
      console.log(`  ❌ Rota não encontrada na base de dados, calculando via coordenadas...`);
    }

    // Se não encontrar, calcular estimativa baseada em coordenadas aproximadas
    if (!distance) {
      // Coordenadas aproximadas de algumas capitais e cidades importantes
      const cityCoords: { [key: string]: { lat: number; lng: number } } = {
        'betim-mg': { lat: -19.9678, lng: -44.1987 },
        'guarulhos-sp': { lat: -23.4538, lng: -46.5333 },
        'sao-paulo-sp': { lat: -23.5505, lng: -46.6333 },
        'rio-de-janeiro-rj': { lat: -22.9068, lng: -43.1729 },
        'curitiba-pr': { lat: -25.4284, lng: -49.2733 },
        'brasilia-df': { lat: -15.7797, lng: -47.9297 },
        'salvador-ba': { lat: -12.9714, lng: -38.5014 },
        'fortaleza-ce': { lat: -3.7319, lng: -38.5267 },
        'porto-alegre-rs': { lat: -30.0346, lng: -51.2177 },
        'recife-pe': { lat: -8.0476, lng: -34.8770 },
        'manaus-am': { lat: -3.1190, lng: -60.0217 },
        'goiania-go': { lat: -16.6869, lng: -49.2648 },
        'belo-horizonte-mg': { lat: -19.9208, lng: -43.9378 },
        'campinas-sp': { lat: -22.9099, lng: -47.0626 },
        'santos-sp': { lat: -23.9608, lng: -46.3335 },
        'sorocaba-sp': { lat: -23.5015, lng: -47.4526 },
        'ribeirao-preto-sp': { lat: -21.1704, lng: -47.8103 },
        'joinville-sc': { lat: -26.3045, lng: -48.8487 },
        'londrina-pr': { lat: -23.3045, lng: -51.1696 },
        'caxias-do-sul-rs': { lat: -29.1634, lng: -51.1797 },
        'campo-grande-ms': { lat: -20.4697, lng: -54.6201 },
        'natal-rn': { lat: -5.7945, lng: -35.2110 },
        'maceio-al': { lat: -9.6498, lng: -35.7089 },
        'aracaju-se': { lat: -10.9472, lng: -37.0731 },
        'teresina-pi': { lat: -5.0892, lng: -42.8019 },
        'sao-luis-ma': { lat: -2.5387, lng: -44.2825 },
        'belem-pa': { lat: -1.4558, lng: -48.5044 },
        'macapa-ap': { lat: 0.0349, lng: -51.0694 },
        'boa-vista-rr': { lat: 2.8235, lng: -60.6758 },
        'rio-branco-ac': { lat: -9.9754, lng: -67.8249 },
        'porto-velho-ro': { lat: -8.7619, lng: -63.9039 },
        'cuiaba-mt': { lat: -15.6014, lng: -56.0979 },
        'palmas-to': { lat: -10.1753, lng: -48.2982 },
        'vitoria-es': { lat: -20.3155, lng: -40.3128 },
        'florianopolis-sc': { lat: -27.5954, lng: -48.5480 },
        'goiana-pe': { lat: -7.5600, lng: -35.0000 },
        'petrolina-pe': { lat: -9.3891, lng: -40.5030 },
        'caruaru-pe': { lat: -8.2837, lng: -35.9761 },
        'garanhuns-pe': { lat: -8.8903, lng: -36.4969 },
        'serra-talhada-pe': { lat: -7.9856, lng: -38.2906 },
        'cabo-de-santo-agostinho-pe': { lat: -8.2905, lng: -35.0349 },
        'camaragibe-pe': { lat: -8.0209, lng: -34.9888 },
        'jaboatao-dos-guararapes-pe': { lat: -8.1130, lng: -35.0149 },
        'olinda-pe': { lat: -8.0089, lng: -34.8553 },
        'paulista-pe': { lat: -7.9407, lng: -34.8730 },
        'abreu-e-lima-pe': { lat: -7.9073, lng: -34.8999 },
        'arcos-mg': { lat: -20.2869, lng: -45.5386 },
        'uberlandia-mg': { lat: -18.9113, lng: -48.2622 },
        'juiz-de-fora-mg': { lat: -21.7642, lng: -43.3502 },
        'montes-claros-mg': { lat: -16.7288, lng: -43.8608 },
        'divinopolis-mg': { lat: -20.1439, lng: -44.8839 },
        'ipatinga-mg': { lat: -19.4682, lng: -42.5369 },
        'sete-lagoas-mg': { lat: -19.4661, lng: -44.2467 },
        'patos-de-minas-mg': { lat: -18.5789, lng: -46.5180 },
        'pocos-de-caldas-mg': { lat: -21.7879, lng: -46.5614 },
        'varginha-mg': { lat: -21.5511, lng: -45.4306 },
        'passos-mg': { lat: -20.7188, lng: -46.6097 },
        'itu-sp': { lat: -23.2640, lng: -47.2990 },
        'jundiai-sp': { lat: -23.1864, lng: -46.8842 },
        'piracicaba-sp': { lat: -22.7253, lng: -47.6492 },
        'bauru-sp': { lat: -22.3147, lng: -49.0608 },
        'marilia-sp': { lat: -22.2133, lng: -49.9456 },
        'presidente-prudente-sp': { lat: -22.1256, lng: -51.3889 },
        'aracatuba-sp': { lat: -21.2089, lng: -50.4328 },
        'sao-jose-do-rio-preto-sp': { lat: -20.8197, lng: -49.3794 }
      };

      let originCoords = cityCoords[normalizedOrigin];
      let destCoords = cityCoords[normalizedDestination];
      
      console.log(`  Coordenadas origem: ${originCoords ? `(${originCoords.lat}, ${originCoords.lng})` : 'NÃO ENCONTRADA'}`);
      console.log(`  Coordenadas destino: ${destCoords ? `(${destCoords.lat}, ${destCoords.lng})` : 'NÃO ENCONTRADA'}`);

      // Se não encontrou as coordenadas, tentar buscar via IBGE API
      if (!originCoords || !destCoords) {
        console.log(`  🔍 Tentando buscar coordenadas via IBGE API...`);
        
        try {
          if (!originCoords) {
            const originIBGE = await fetchCityCoordinatesFromIBGE(originCity);
            if (originIBGE) {
              originCoords = originIBGE;
              console.log(`  ✅ Coordenadas origem IBGE: (${originCoords.lat}, ${originCoords.lng})`);
            }
          }
          
          if (!destCoords) {
            const destIBGE = await fetchCityCoordinatesFromIBGE(destinationCity);
            if (destIBGE) {
              destCoords = destIBGE;
              console.log(`  ✅ Coordenadas destino IBGE: (${destCoords.lat}, ${destCoords.lng})`);
            }
          }
        } catch (error) {
          console.log(`  ❌ Erro ao buscar coordenadas via IBGE: ${error}`);
        }
      }

      if (originCoords && destCoords) {
        // Cálculo de distância usando fórmula de Haversine
        const R = 6371; // Raio da Terra em km
        const dLat = (destCoords.lat - originCoords.lat) * Math.PI / 180;
        const dLng = (destCoords.lng - originCoords.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = Math.round(R * c * 1.2); // Multiplicar por 1.2 para considerar rotas rodoviárias
        console.log(`  ✅ Distância calculada via Haversine: ${distance}km`);
      }
    }

    // Se ainda não conseguiu calcular, usar estimativa padrão
    if (!distance) {
      distance = 500; // Distância padrão em km
      console.log(`  ⚠️  Usando distância padrão: ${distance}km`);
    }
    
    console.log(`[DEBUG] Distância final calculada: ${distance}km\n`);
    return distance;
  } catch (error) {
    console.error('Erro ao calcular distância entre cidades:', error);
    return 500; // Distância padrão em caso de erro
  }
}


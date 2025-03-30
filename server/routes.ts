import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { driverValidator, vehicleValidator, clientValidator, freightValidator, freightDestinationValidator } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { 
  isAuthenticated, 
  isAdmin, 
  isAdminOrSelf,
  hasClientAccess,
  hasDriverAccess,
  hasFreightAccess,
  hasVehicleAccess
} from "./middlewares";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./stripe";
import Stripe from "stripe";
import { sendSubscriptionEmail, sendPaymentReminderEmail } from "./email-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  
  // Ativação de teste gratuito (7 dias)
  app.post("/api/activate-trial", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Calcula a data de expiração do teste (7 dias a partir de hoje)
      const trialExpirationDate = new Date();
      trialExpirationDate.setDate(trialExpirationDate.getDate() + 7);
      
      // Atualiza o usuário com status de assinatura ativa e data de expiração
      const updatedUser = await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: "trial",
        subscriptionEndDate: trialExpirationDate,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.status(200).json({ message: "Teste gratuito ativado com sucesso", expirationDate: trialExpirationDate });
    } catch (error) {
      console.error("Error activating trial:", error);
      res.status(500).json({ message: "Erro ao ativar período de teste" });
    }
  });
  
  // Ativação de acesso gratuito para motoristas
  app.post("/api/activate-driver-access", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Verifica se o usuário é do tipo motorista
      const user = await storage.getUserById(userId);
      if (!user || user.profileType !== "driver") {
        return res.status(403).json({ message: "Apenas motoristas podem ativar o acesso gratuito" });
      }
      
      // Ativa o acesso limitado para motoristas (sem data de expiração)
      // Define como "driver_free" para não passar pelo sistema de cobrança
      const updatedUser = await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: "driver_free",
        paymentRequired: false, // Indica que não precisa de pagamento
        // Sem data de expiração para motoristas (acesso permanente limitado)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log(`Acesso gratuito de motorista ativado para usuário ${userId}`);
      
      res.status(200).json({ 
        message: "Acesso de motorista ativado com sucesso",
        user: {
          ...updatedUser,
          password: undefined // Remove a senha antes de retornar para o cliente
        }
      });
    } catch (error) {
      console.error("Error activating driver access:", error);
      res.status(500).json({ message: "Erro ao ativar acesso de motorista" });
    }
  });
  // API routes for drivers
  app.get("/api/drivers", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      if (search) {
        const drivers = await storage.searchDrivers(search);
        return res.json(drivers);
      }
      
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.json(driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", async (req: Request, res: Response) => {
    try {
      const driverData = driverValidator.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", hasDriverAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const driverData = driverValidator.parse(req.body);
      const driver = await storage.updateDriver(id, driverData);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.json(driver);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", hasDriverAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteDriver(id);
      if (!success) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // API routes for vehicles
  app.get("/api/vehicles", async (req: Request, res: Response) => {
    try {
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
      const search = req.query.search as string;
      
      if (search) {
        const vehicles = await storage.searchVehicles(search);
        return res.json(vehicles);
      }
      
      if (driverId) {
        const vehicles = await storage.getVehiclesByDriver(driverId);
        return res.json(vehicles);
      }
      
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

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

  app.post("/api/vehicles", async (req: Request, res: Response) => {
    try {
      const vehicleData = vehicleValidator.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const vehicleData = vehicleValidator.parse(req.body);
      const vehicle = await storage.updateVehicle(id, vehicleData);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteVehicle(id);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // API routes for clients
  app.get("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      
      // Se não for admin, só retorna o cliente do próprio usuário
      if (req.user?.profileType !== "admin") {
        // Verificar se o usuário tem um cliente associado
        if (!req.user?.clientId) {
          return res.json([]);
        }
        
        // Retornar apenas o cliente do usuário
        const client = await storage.getClient(req.user.clientId);
        return res.json(client ? [client] : []);
      }
      
      // Administradores podem pesquisar e ver todos os clientes
      if (search) {
        const clients = await storage.searchClients(search);
        return res.json(clients);
      }
      
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Se não for admin, verifica se é o próprio cliente do usuário
      if (req.user?.profileType !== "admin" && req.user?.clientId !== id) {
        return res.status(403).json({ message: "Acesso não autorizado a este cliente" });
      }

      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const clientData = clientValidator.parse(req.body);
      const client = await storage.createClient(clientData);
      
      // Se o usuário estiver autenticado, associa o cliente ao usuário
      if (req.isAuthenticated() && req.user) {
        const userId = req.user.id;
        // Atualiza o usuário para ter o clientId
        await storage.updateUser(userId, { clientId: client.id });
        // Atualiza o objeto req.user para refletir a mudança
        req.user.clientId = client.id;
      }
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const clientData = clientValidator.parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // API routes for freights
  app.get("/api/freights", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      
      if (search) {
        const freights = await storage.searchFreights(search);
        return res.json(freights);
      }
      
      const freights = await storage.getFreights();
      res.json(freights);
    } catch (error) {
      console.error("Error fetching freights:", error);
      res.status(500).json({ message: "Failed to fetch freights" });
    }
  });

  app.get("/api/freights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const freight = await storage.getFreight(id);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }

      // Se não for admin, verifica se o frete pertence ao cliente do usuário
      if (req.user?.profileType !== "admin" && freight.clientId !== req.user?.clientId) {
        return res.status(403).json({ message: "Acesso não autorizado a este frete" });
      }

      res.json(freight);
    } catch (error) {
      console.error("Error fetching freight:", error);
      res.status(500).json({ message: "Failed to fetch freight" });
    }
  });

  app.post("/api/freights", async (req: Request, res: Response) => {
    try {
      const freightData = freightValidator.parse(req.body);
      
      // Definir data de expiração para 30 dias após a criação
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + 30);
      
      // Adicionar a data de expiração ao frete
      const freightWithExpiration = {
        ...freightData,
        expirationDate: expirationDate,
        // Garantir status "aberto" para novos fretes
        status: "aberto"
      };
      
      const freight = await storage.createFreight(freightWithExpiration);
      res.status(201).json(freight);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating freight:", error);
      res.status(500).json({ message: "Failed to create freight" });
    }
  });

  app.put("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Obter o frete existente para preservar o clientId
      const existingFreight = await storage.getFreight(id);
      if (!existingFreight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Validar os dados do frete
      const freightData = freightValidator.parse(req.body);
      
      // Preservar o clientId original, garantindo que o dono do frete não mude
      const updatedFreightData = {
        ...freightData,
        clientId: existingFreight.clientId
      };
      
      // Atualizar o frete mantendo o clientId original
      const freight = await storage.updateFreight(id, updatedFreightData);
      
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }

      res.json(freight);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating freight:", error);
      res.status(500).json({ message: "Failed to update freight" });
    }
  });

  app.delete("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteFreight(id);
      if (!success) {
        return res.status(404).json({ message: "Freight not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting freight:", error);
      res.status(500).json({ message: "Failed to delete freight" });
    }
  });

  // API routes for freight destinations
  app.get("/api/freight-destinations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const freightId = req.query.freightId ? parseInt(req.query.freightId as string) : undefined;
      
      if (!freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      // Verificar se o usuário tem acesso ao frete
      if (req.user?.profileType !== "admin") {
        const freight = await storage.getFreight(freightId);
        if (!freight) {
          return res.status(404).json({ message: "Freight not found" });
        }
        
        // Verificar se o frete pertence ao cliente do usuário
        if (freight.clientId !== req.user?.clientId) {
          return res.status(403).json({ message: "Acesso não autorizado a este destino de frete" });
        }
      }
      
      const destinations = await storage.getFreightDestinations(freightId);
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching freight destinations:", error);
      res.status(500).json({ message: "Failed to fetch freight destinations" });
    }
  });

  app.post("/api/freight-destinations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const destinationData = freightDestinationValidator.parse(req.body);
      
      // Verificar se o usuário tem acesso ao frete associado ao destino
      if (req.user?.profileType !== "admin") {
        const freight = await storage.getFreight(destinationData.freightId);
        if (!freight) {
          return res.status(404).json({ message: "Freight not found" });
        }
        
        // Verificar se o frete pertence ao cliente do usuário
        if (freight.clientId !== req.user?.clientId) {
          return res.status(403).json({ message: "Acesso não autorizado para adicionar destinos a este frete" });
        }
      }
      
      const destination = await storage.createFreightDestination(destinationData);
      res.status(201).json(destination);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating freight destination:", error);
      res.status(500).json({ message: "Failed to create freight destination" });
    }
  });

  app.delete("/api/freight-destinations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Buscar o destino do frete para verificar a permissão
      const destinations = await storage.getFreightDestinations(-1); // Obter todos os destinos
      const destination = destinations.find(d => d.id === id);
      
      if (!destination) {
        return res.status(404).json({ message: "Freight destination not found" });
      }
      
      // Verificar se o usuário tem acesso ao frete associado ao destino
      if (req.user?.profileType !== "admin") {
        const freight = await storage.getFreight(destination.freightId);
        if (!freight) {
          return res.status(404).json({ message: "Freight not found" });
        }
        
        // Verificar se o frete pertence ao cliente do usuário
        if (freight.clientId !== req.user?.clientId) {
          return res.status(403).json({ message: "Acesso não autorizado para excluir este destino de frete" });
        }
      }

      const success = await storage.deleteFreightDestination(id);
      if (!success) {
        return res.status(404).json({ message: "Freight destination not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting freight destination:", error);
      res.status(500).json({ message: "Failed to delete freight destination" });
    }
  });

  // Rota para associar um cliente existente ao usuário logado
  app.post("/api/users/associate-client", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }
      
      const id = parseInt(clientId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID format" });
      }
      
      // Verificar se o cliente existe
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Atualizar o usuário com o clientId
      const userId = req.user.id;
      const user = await storage.updateUser(userId, { clientId: id });
      
      if (!user) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      // Atualiza o objeto req.user para refletir a mudança
      req.user.clientId = id;
      
      res.status(200).json({ message: "Client associated successfully", user });
    } catch (error) {
      console.error("Error associating client to user:", error);
      res.status(500).json({ message: "Failed to associate client to user" });
    }
  });

  // Rotas da área financeira administrativa
  app.get("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      // Buscar assinaturas do banco de dados
      const dbSubscriptions = await storage.getSubscriptions();
      
      if (!dbSubscriptions || !Array.isArray(dbSubscriptions) || dbSubscriptions.length === 0) {
        // Se não houver assinaturas, retornar array vazio em vez de dados simulados
        return res.json([]);
      }
      
      // Formatar os dados das assinaturas para a resposta da API
      const formattedSubscriptions = await Promise.all(dbSubscriptions.map(async (subscription) => {
        // Buscar informações de cliente e usuário associados
        let clientName = 'Cliente não associado';
        let email = 'Email não disponível';
        
        if (subscription.clientId) {
          const client = await storage.getClient(subscription.clientId);
          if (client) {
            clientName = client.name;
            email = client.email;
          }
        } else if (subscription.userId) {
          const user = await storage.getUserById(subscription.userId);
          if (user) {
            clientName = user.name;
            email = user.email;
          }
        }
        
        // Buscar faturas desta assinatura para calcular o valor total
        const invoices = await storage.getInvoicesBySubscription(subscription.id);
        
        // Calcular o valor total baseado no tipo de plano
        let amount = 99.90; // Valor padrão mensal
        
        // Determinar o valor baseado no tipo de plano
        if (subscription.planType === 'annual') {
          amount = 1198.80; // R$ 99,90 * 12 = R$ 1.198,80
        } else if (subscription.planType === 'trial') {
          amount = 0; // Teste gratuito
        }
        
        return {
          id: subscription.stripeSubscriptionId || `sub_local_${subscription.id}`,
          internalId: subscription.id,
          clientName,
          email,
          status: subscription.status,
          plan: subscription.planType,
          startDate: subscription.currentPeriodStart ? 
            new Date(subscription.currentPeriodStart).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          endDate: subscription.currentPeriodEnd ? 
            new Date(subscription.currentPeriodEnd).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          amount,
          invoiceCount: invoices.length,
          stripeCustomerId: subscription.stripeCustomerId,
        };
      }));
      
      res.json(formattedSubscriptions);
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions: " + error.message });
    }
  });
  
  app.post("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, clientId, planType, status, startDate, endDate } = req.body;
      
      // Validar os dados recebidos
      if (!planType || !status) {
        return res.status(400).json({ message: "Tipo de plano e status são obrigatórios" });
      }
      
      if (!userId && !clientId) {
        return res.status(400).json({ message: "É necessário fornecer um ID de usuário ou cliente" });
      }
      
      // Verificar se o usuário existe
      let user = null;
      if (userId) {
        user = await storage.getUserById(Number(userId));
        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
      }
      
      // Verificar se o cliente existe
      let client = null;
      if (clientId) {
        client = await storage.getClient(Number(clientId));
        if (!client) {
          return res.status(404).json({ message: "Cliente não encontrado" });
        }
      }
      
      // Converter datas se fornecidas como strings
      const currentPeriodStart = startDate ? new Date(startDate) : new Date();
      let currentPeriodEnd;
      
      if (endDate) {
        currentPeriodEnd = new Date(endDate);
      } else {
        // Definir data de fim com base no tipo de plano
        currentPeriodEnd = new Date(currentPeriodStart);
        if (planType === 'annual') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        } else if (planType === 'monthly') {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        } else if (planType === 'trial') {
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7); // 7 dias de teste
        }
      }
      
      // Criar assinatura no banco de dados
      const subscription = await storage.createSubscription({
        userId: userId ? Number(userId) : undefined,
        clientId: clientId ? Number(clientId) : undefined,
        status: status,
        planType: planType,
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        stripeCustomerId: req.body.stripeCustomerId || null,
        stripeSubscriptionId: req.body.stripeSubscriptionId || null,
        stripePriceId: req.body.stripePriceId || process.env.STRIPE_PRICE_ID || null,
        cancelAt: req.body.cancelAt ? new Date(req.body.cancelAt) : null,
        canceledAt: req.body.canceledAt ? new Date(req.body.canceledAt) : null,
      });
      
      // Se a assinatura for criada via admin, também atualizar o status de assinatura do usuário
      if (userId) {
        await storage.updateUser(Number(userId), {
          subscriptionActive: status === 'active' || status === 'trialing',
          subscriptionType: planType,
          stripeCustomerId: req.body.stripeCustomerId || null,
          stripeSubscriptionId: req.body.stripeSubscriptionId || null,
        });
      }
      
      // Tentar enviar email de confirmação de assinatura
      try {
        if (client) {
          const amount = parseFloat(req.body.amount) || 0;
          sendSubscriptionEmail(
            client.email,
            client.name,
            planType,
            currentPeriodStart,
            currentPeriodEnd,
            amount
          );
        }
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação de assinatura:", emailError);
        // Não interrompe o fluxo em caso de falha no envio de email
      }
      
      // Retornar a assinatura criada
      res.status(201).json(subscription);
    } catch (error: any) {
      console.error("Erro ao criar assinatura:", error);
      res.status(500).json({ message: "Falha ao criar assinatura: " + error.message });
    }
  });
  
  app.get("/api/admin/invoices", isAdmin, async (req: Request, res: Response) => {
    try {
      // Buscar todas as faturas do banco de dados
      const dbInvoices = await storage.getInvoices();
      
      if (!dbInvoices || !Array.isArray(dbInvoices) || dbInvoices.length === 0) {
        // Se não houver faturas, retornar um array vazio em vez de criar dados de demonstração
        return res.json([]);
      }
      
      // Se já existirem faturas no banco, formatar e retornar
      const formattedInvoices = await Promise.all(dbInvoices.map(async (invoice) => {
        // Buscar o cliente, se existir
        let clientName = 'Cliente não associado';
        if (invoice.clientId) {
          const client = await storage.getClient(invoice.clientId);
          if (client) clientName = client.name;
        } else {
          // Se não houver cliente, buscar o usuário
          const user = await storage.getUserById(invoice.userId);
          if (user) clientName = user.name;
        }
        
        return {
          id: invoice.id,
          clientName,
          status: invoice.status,
          invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
          amount: Number(invoice.amount),
          invoiceNumber: invoice.invoiceNumber,
          stripeInvoiceId: invoice.stripeInvoiceId,
          description: invoice.description,
          amountPaid: Number(invoice.amountPaid || 0),
          amountDue: Number(invoice.amountDue || 0),
          receiptUrl: invoice.receiptUrl
        };
      }));
      
      res.json(formattedInvoices);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  // Rotas de pagamento com Stripe
  app.post("/api/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await createCheckoutSession(req, res);
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/create-portal-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await createPortalSession(req, res);
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Webhook do Stripe (não requer autenticação, pois é chamado pelo Stripe)
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    try {
      await handleWebhook(req, res);
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });
  
  // Endpoint para criar uma intent de pagamento único
  app.post("/api/create-payment-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converte para centavos
        currency: "brl",
        payment_method_types: ["card"],
        metadata: {
          userId: req.user?.id.toString(),
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint para criar ou obter uma assinatura
  app.post("/api/get-or-create-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error('Missing required Stripe config: STRIPE_PRICE_ID');
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
      
      // Verifica se o usuário já tem uma assinatura ativa
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Se a assinatura estiver ativa, retorna os dados relevantes
          if (subscription.status === 'active') {
            return res.json({
              subscriptionId: subscription.id,
              status: subscription.status,
            });
          }
        } catch (error) {
          console.log("Erro ao buscar assinatura existente, criando nova:", error);
        }
      }
      
      // Cria um cliente Stripe para o usuário se ele não tiver um
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id.toString(),
          },
        });
        customerId = customer.id;
        
        // Atualiza o usuário com o ID do cliente Stripe
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }
      
      // Cria uma nova assinatura
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Atualiza o usuário com o ID da assinatura Stripe
      await storage.updateUser(user.id, { 
        stripeSubscriptionId: subscription.id,
      });
      
      // Cria o registro da assinatura na nossa tabela
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Para assinatura mensal por padrão
      
      // Cria a assinatura no banco de dados
      await storage.createSubscription({
        userId: user.id,
        clientId: user.clientId || undefined,
        stripeSubscriptionId: subscription.id,
        stripePriceId: process.env.STRIPE_PRICE_ID,
        stripeCustomerId: customerId,
        status: "incomplete", // Status inicial da assinatura
        planType: "annual", // Tipo de plano por padrão
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        metadata: {},
      });
      
      // Retorna os dados relevantes, incluindo o clientSecret para completar o pagamento
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rotas de administração financeira
  app.get("/api/admin/finance/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      // Buscar dados do banco de dados
      const subscriptionsDb = await storage.getSubscriptions();
      const invoicesDb = await storage.getInvoices();
      
      if (!subscriptionsDb || subscriptionsDb.length === 0) {
        // Se não houver assinaturas no banco, retornar zeros em vez de dados simulados
        return res.json({
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          monthlyData: [
            { month: "Jan", revenue: 0 },
            { month: "Fev", revenue: 0 },
            { month: "Mar", revenue: 0 },
            { month: "Abr", revenue: 0 },
            { month: "Mai", revenue: 0 },
            { month: "Jun", revenue: 0 },
            { month: "Jul", revenue: 0 },
            { month: "Ago", revenue: 0 },
            { month: "Set", revenue: 0 },
            { month: "Out", revenue: 0 },
            { month: "Nov", revenue: 0 },
            { month: "Dez", revenue: 0 },
          ],
          subscriptionsByStatus: [
            { status: "Ativas", count: 0 },
            { status: "Teste", count: 0 },
            { status: "Canceladas", count: 0 },
            { status: "Atrasadas", count: 0 }
          ]
        });
      }
      
      // Calcular estatísticas com base em dados reais do banco
      const activeSubscriptions = subscriptionsDb.filter(s => s.status === 'active').length;
      const trialing = subscriptionsDb.filter(s => s.status === 'trialing').length;
      const canceled = subscriptionsDb.filter(s => s.status === 'canceled').length;
      const pastDue = subscriptionsDb.filter(s => s.status === 'past_due').length;
      
      // Calcular receita total baseada nas faturas pagas
      const paidInvoices = invoicesDb.filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
      
      // Calcular receita mensal (média dos últimos 3 meses)
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const recentInvoices = paidInvoices.filter(invoice => {
        return invoice.paidAt && new Date(invoice.paidAt) >= threeMonthsAgo;
      });
      
      const monthlyRevenue = recentInvoices.length > 0
        ? recentInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0) / 3
        : 0;
      
      // Taxa de cancelamento (churn)
      const totalSubscriptions = subscriptionsDb.length;
      const churnRate = totalSubscriptions > 0
        ? (canceled / totalSubscriptions) * 100
        : 0;
      
      // Agrupar receita por mês para os últimos 12 meses
      const lastYear = new Date();
      lastYear.setFullYear(today.getFullYear() - 1);
      
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));
      
      // Processar as faturas pagas para montar o gráfico de receita mensal
      paidInvoices.forEach(invoice => {
        if (invoice.paidAt) {
          const paidDate = new Date(invoice.paidAt);
          if (paidDate >= lastYear) {
            const monthIndex = paidDate.getMonth();
            monthlyData[monthIndex].revenue += Number(invoice.amount);
          }
        }
      });
      
      // Arredondar valores para 2 casas decimais
      monthlyData.forEach(data => {
        data.revenue = parseFloat(data.revenue.toFixed(2));
      });
      
      const stats = {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        activeSubscriptions,
        churnRate: parseFloat(churnRate.toFixed(1)),
        monthlyData,
        subscriptionsByStatus: [
          { status: "Ativas", count: activeSubscriptions },
          { status: "Teste", count: trialing },
          { status: "Canceladas", count: canceled },
          { status: "Atrasadas", count: pastDue }
        ]
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching finance stats:", error);
      res.status(500).json({ message: "Failed to fetch finance statistics: " + error.message });
    }
  });
  
  app.post("/api/admin/finance/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      // Em produção, isso salvaria as configurações no banco de dados
      console.log("Received finance settings:", req.body);
      res.json({ message: "Finance settings updated successfully" });
    } catch (error) {
      console.error("Error updating finance settings:", error);
      res.status(500).json({ message: "Failed to update finance settings" });
    }
  });

  // API para gerenciamento de usuários pelo administrador
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Erro ao obter usuários" });
    }
  });

  // Bloquear/desbloquear acesso de um usuário
  app.put("/api/admin/users/:id/toggle-access", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { blocked } = req.body;
      
      // Buscar usuário atual
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar status de bloqueio usando o método específico
      const updatedUser = await storage.toggleUserAccess(userId, !blocked);
      
      res.status(200).json({ 
        message: blocked ? "Usuário bloqueado com sucesso" : "Acesso do usuário liberado com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error toggling user access:", error);
      res.status(500).json({ message: "Erro ao alterar acesso do usuário" });
    }
  });

  // Enviar e-mail de cobrança para um usuário
  app.post("/api/admin/users/:id/send-payment-reminder", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { message } = req.body;
      
      // Buscar usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Enviar e-mail de cobrança
      const emailSent = await sendPaymentReminderEmail(user, message);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Não foi possível enviar o e-mail. Verifique a configuração do serviço de e-mail." });
      }
      
      res.status(200).json({ message: "E-mail de cobrança enviado com sucesso" });
    } catch (error) {
      console.error("Error sending payment reminder:", error);
      res.status(500).json({ message: "Erro ao enviar e-mail de cobrança" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
